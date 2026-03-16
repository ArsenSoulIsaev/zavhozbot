import express from "express";
import { parseMessage } from "./parser.js";
import {
  askSecretWord,
  authFail,
  authSuccess,
  greet,
  notRegistered,
  toolLocationReply,
  toolNotFound,
  toolReturned,
  toolTaken,
  toolAlreadyTaken,
  toolHeldByOther,
  toolNotInUse,
  unknownCommand
} from "./replies.js";
import {
  bindTelegramId,
  findUserByName,
  findUserByTelegramId,
  touchReauth,
  verifySecretWord,
  needsReauth
} from "../auth/auth.service.js";
import {
  findToolByNameOrAlias,
  getToolLocation,
  returnTool,
  takeTool
} from "../tools/tools.service.js";

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
    const displayName = from.first_name || from.username || "друг";
    const parsed = parseMessage(text);

    let knownUser = await findUserByTelegramId(telegramId);

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

      const candidate = await findUserByName(displayName);

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

    if (parsed.type === "take_tool") {
      const tool = await findToolByNameOrAlias(parsed.toolName);

      if (!tool) {
        return res.status(200).json({ reply: toolNotFound(parsed.toolName) });
      }

      await takeTool({
        toolId: tool.id,
        actorUserId: knownUser.id,
        currentObjectId: tool.current_object_id
      });

      return res.status(200).json({
        reply: toolTaken(`${tool.title} (${tool.id})`)
      });
    }

    if (parsed.type === "return_tool") {
      const tool = await findToolByNameOrAlias(parsed.toolName);

      if (!tool) {
        return res.status(200).json({ reply: toolNotFound(parsed.toolName) });
      }

      await returnTool({
        toolId: tool.id,
        actorUserId: knownUser.id,
        currentObjectId: tool.current_object_id
      });

      return res.status(200).json({
        reply: toolReturned(`${tool.title} (${tool.id})`)
      });
    }

    return res.status(200).json({
      reply: `${greet()} ${unknownCommand()}`
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      reply: "Что-то заскрипело в механизме. Надо поправить."
    });
  }
});
