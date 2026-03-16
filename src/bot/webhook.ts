import express from "express";
import { parseMessage } from "./parser.js";
import {
  allToolsReply,
  askSecretWord,
  authFail,
  authSuccess,
  baseCloseForbidden,
  bulkReturnedToBase,
  greet,
  notRegistered,
  objectAlreadyClosed,
  objectClosed,
  objectNotFound,
  permissionDenied,
  toolAdded,
  toolAlreadyTaken,
  toolDeleteBlocked,
  toolDeleted,
  toolHeldByOther,
  toolLocationReply,
  toolNotFound,
  toolNotInUse,
  toolReturned,
  toolTaken,
  unknownCommand
} from "./replies.js";
import {
  bindTelegramId,
  findUserByTelegramUsername,
  findUserByTelegramId,
  needsReauth,
  touchReauth,
  verifySecretWord
} from "../auth/auth.service.js";
import {
  canCloseObjects,
  canManageTools,
  canViewAll
} from "../auth/permissions.js";
import {
  addTool,
  deleteTool,
  findToolByNameOrAlias,
  getToolLocation,
  listAllTools,
  returnAllToolsFromObject,
  returnTool,
  takeTool
} from "../tools/tools.service.js";
import {
  closeObject,
  findObjectByName,
  getBaseObject
} from "../objects/objects.service.js";

export const webhookRouter = express.Router();

const pendingAuth = new Map<number, { userId: number; name: string }>();

webhookRouter.post("/telegram/webhook", async (req, res) => {
  try {
    const body = req.body;
    const message = body?.message;
    const text: string = message?.text || "";
    const from = message?.from;

    if (!from?.id) {
      return res.status(200).json({ ok: true });
    }

    const telegramId = from.id;
    const telegramUsername = from.username || "";
    const parsed = parseMessage(text);

    const knownUser = await findUserByTelegramId(telegramId);

    if (!knownUser) {
      const pending = pendingAuth.get(telegramId);

      if (pending && parsed.type === "auth_secret") {
        const ok = await verifySecretWord(pending.userId, parsed.secret);

        if (!ok) {
          return res.status(200).json({ reply: authFail() });
        }

        await bindTelegramId(pending.userId, telegramId);
        pendingAuth.delete(telegramId);

        return res.status(200).json({ reply: authSuccess(pending.name) });
      }

      if (!telegramUsername) {
        return res.status(200).json({
          reply: "У тебя в Telegram не вижу username. Без него первичную привязку лучше не делать. Пусть Арсен заведёт тебя правильно."
        });
      }

      const candidate = await findUserByTelegramUsername(telegramUsername);

      if (!candidate) {
        return res.status(200).json({ reply: notRegistered() });
      }

      pendingAuth.set(telegramId, { userId: candidate.id, name: candidate.name });
      return res.status(200).json({ reply: askSecretWord() });
    }

    if (needsReauth(knownUser.last_reauth_at)) {
      if (parsed.type !== "auth_secret") {
        pendingAuth.set(telegramId, { userId: knownUser.id, name: knownUser.name });
        return res.status(200).json({
          reply: `Хари Хари, ${knownUser.name}. Пора освежить память. Назови секретное слово.`
        });
      }

      const ok = await verifySecretWord(knownUser.id, parsed.secret);
      if (!ok) {
        return res.status(200).json({ reply: authFail() });
      }

      await touchReauth(knownUser.id);

      return res.status(200).json({
        reply: `${knownUser.name}, всё сходится. Работаем дальше.`
      });
    }

    if (parsed.type === "where_tool") {
      const tool = await findToolByNameOrAlias(parsed.toolName);

      if (!tool) {
        return res.status(200).json({ reply: toolNotFound(parsed.toolName) });
      }

      const location = await getToolLocation(tool.id);

      if (!location) {
        return res.status(200).json({ reply: toolNotFound(parsed.toolName) });
      }

      return res.status(200).json({
        reply: toolLocationReply({
          title: `${location.title} (${location.id})`,
          objectName: location.object_name,
          responsibleName: location.responsible_name,
          status: location.status
        })
      });
    }

    if (parsed.type === "where_all") {
      if (!canViewAll(knownUser)) {
        return res.status(200).json({ reply: permissionDenied() });
      }

      const tools = await listAllTools();
      const lines = tools.map(
        (tool) =>
          `— ${tool.title} (${tool.id}) · объект: ${tool.object_name || "не указан"} · ответственный: ${tool.responsible_name || "нет"} · статус: ${tool.status}`
      );

      return res.status(200).json({
        reply: allToolsReply(lines)
      });
    }

    if (parsed.type === "take_tool") {
      const tool = await findToolByNameOrAlias(parsed.toolName);

      if (!tool) {
        return res.status(200).json({ reply: toolNotFound(parsed.toolName) });
      }

      const result = await takeTool({
        toolId: tool.id,
        actorUserId: knownUser.id,
        currentObjectId: tool.current_object_id
      });

      if (result === "already_taken") {
        return res.status(200).json({
          reply: toolAlreadyTaken(`${tool.title} (${tool.id})`)
        });
      }

      return res.status(200).json({
        reply: toolTaken(`${tool.title} (${tool.id})`)
      });
    }

    if (parsed.type === "return_tool") {
      const tool = await findToolByNameOrAlias(parsed.toolName);

      if (!tool) {
        return res.status(200).json({ reply: toolNotFound(parsed.toolName) });
      }

      const result = await returnTool({
        toolId: tool.id,
        actorUserId: knownUser.id,
        currentObjectId: tool.current_object_id
      });

      if (result === "not_in_use") {
        return res.status(200).json({
          reply: toolNotInUse(`${tool.title} (${tool.id})`)
        });
      }

      if (result === "held_by_other") {
        return res.status(200).json({
          reply: toolHeldByOther(`${tool.title} (${tool.id})`)
        });
      }

      return res.status(200).json({
        reply: toolReturned(`${tool.title} (${tool.id})`)
      });
    }

    if (parsed.type === "add_tool") {
      if (!canManageTools(knownUser)) {
        return res.status(200).json({ reply: permissionDenied() });
      }

      const base = await getBaseObject();

      const tool = await addTool({
        title: parsed.payload.title,
        aliases: parsed.payload.aliases,
        family: parsed.payload.family,
        toolType: parsed.payload.toolType,
        actorUserId: knownUser.id,
        baseObjectId: base.id
      });

      return res.status(200).json({
        reply: toolAdded(`${tool.title} (${tool.id})`)
      });
    }

    if (parsed.type === "delete_tool") {
      if (!canManageTools(knownUser)) {
        return res.status(200).json({ reply: permissionDenied() });
      }

      const tool = await findToolByNameOrAlias(parsed.toolName);

      if (!tool) {
        return res.status(200).json({ reply: toolNotFound(parsed.toolName) });
      }

      const result = await deleteTool({
        toolId: tool.id,
        actorUserId: knownUser.id,
        currentObjectId: tool.current_object_id
      });

      if (result === "in_use") {
        return res.status(200).json({
          reply: toolDeleteBlocked(`${tool.title} (${tool.id})`)
        });
      }

      return res.status(200).json({
        reply: toolDeleted(`${tool.title} (${tool.id})`)
      });
    }

    if (parsed.type === "close_object") {
      if (!canCloseObjects(knownUser)) {
        return res.status(200).json({ reply: permissionDenied() });
      }

      const object = await findObjectByName(parsed.objectName);

      if (!object) {
        return res.status(200).json({ reply: objectNotFound(parsed.objectName) });
      }

      const result = await closeObject({ objectId: object.id });

      if (result === "base_forbidden") {
        return res.status(200).json({ reply: baseCloseForbidden() });
      }

      if (result === "already_closed") {
        return res.status(200).json({
          reply: objectAlreadyClosed(object.name)
        });
      }

      return res.status(200).json({
        reply: objectClosed(object.name)
      });
    }

    if (parsed.type === "return_all_from_object") {
      if (!canManageTools(knownUser)) {
        return res.status(200).json({ reply: permissionDenied() });
      }

      const object = await findObjectByName(parsed.objectName);

      if (!object) {
        return res.status(200).json({ reply: objectNotFound(parsed.objectName) });
      }

      const base = await getBaseObject();

      const count = await returnAllToolsFromObject({
        objectId: object.id,
        baseObjectId: base.id,
        actorUserId: knownUser.id
      });

      return res.status(200).json({
        reply: bulkReturnedToBase(object.name, count)
      });
    }

    return res.status(200).json({
      reply: `${greet()} ${unknownCommand()}`
    });
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return res.status(500).json({
      ok: false
    });
  }
});
