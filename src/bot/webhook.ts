import express from "express";
import { sendTelegramMessage } from "./telegram.js";
import { parseMessage } from "./parser.js";
import {
  baseCloseForbidden,
  bulkReturnedToBase,
  objectActivated,
  objectAlreadyClosed,
  objectClosed,
  objectCreated,
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
  toolsListReply,
  unknownCommand,
  userAdded
} from "./replies.js";
import {
  bindTelegramId,
  findUserByTelegramId,
  findUserByTelegramUsername,
  needsReauth,
  touchReauth,
  verifySecretWord
} from "../auth/auth.service.js";
import {
  canManageObjects,
  canManageTools,
  canManageUsers,
  canViewAll
} from "../auth/permissions.js";
import { createUser } from "../users/users.service.js";
import {
  closeObject,
  createObject,
  findObjectByName,
  getBaseObject,
  activateObject
} from "../objects/objects.service.js";
import {
  addTool,
  deleteTool,
  findToolByNameOrAlias,
  getToolLocation,
  listAllTools,
  listMyTools,
  returnAllToolsFromObject,
  returnTool,
  takeTool
} from "../tools/tools.service.js";

export const webhookRouter = express.Router();
const pendingAuth = new Map<number, { userId: number; name: string }>();

async function replyAndOk(res: express.Response, chatId: number, text: string) {
  await sendTelegramMessage(chatId, text);
  return res.status(200).json({ ok: true });
}

webhookRouter.post("/telegram/webhook", async (req, res) => {
  try {
    const message = req.body?.message;
    const text = message?.text?.trim() || "";
    const from = message?.from;
    const chatId = message?.chat?.id;

    if (!from?.id || !chatId) return res.status(200).json({ ok: true });

    const telegramId = from.id;
    const username = from.username || "";

    let knownUser = await findUserByTelegramId(telegramId);

    if (!knownUser) {
      const pending = pendingAuth.get(telegramId);

      if (pending) {
        const ok = await verifySecretWord(pending.userId, text);

        if (!ok) {
          return replyAndOk(res, chatId, "Секретное слово не сошлось. Проверь спокойно и напиши ещё раз.");
        }

        await bindTelegramId(pending.userId, telegramId);
        pendingAuth.delete(telegramId);

        return replyAndOk(res, chatId, `${pending.name}, признал тебя. Доступ открыл, всё учёл.`);
      }

      if (!username) {
        return replyAndOk(res, chatId, "У тебя в Telegram не вижу username. Пусть Арсен сначала заведёт тебя правильно.");
      }

      const candidate = await findUserByTelegramUsername(username);

      if (!candidate) {
        return replyAndOk(res, chatId, "Тебя у меня в списке пока нет. Пусть Арсен добавит тебя в систему.");
      }

      pendingAuth.set(telegramId, { userId: candidate.id, name: candidate.name });
      return replyAndOk(res, chatId, "Назови своё секретное слово. Без этого в кладовую учёта не пущу.");
    }

    if (needsReauth(knownUser.last_reauth_at)) {
      const pending = pendingAuth.get(telegramId);

      if (!pending) {
        pendingAuth.set(telegramId, { userId: knownUser.id, name: knownUser.name });
        return replyAndOk(res, chatId, `${knownUser.name}, пора освежить память. Назови секретное слово.`);
      }

      const ok = await verifySecretWord(knownUser.id, text);

      if (!ok) {
        return replyAndOk(res, chatId, "Секретное слово не сошлось. Проверь спокойно и напиши ещё раз.");
      }

      pendingAuth.delete(telegramId);
      await touchReauth(knownUser.id);

      return replyAndOk(res, chatId, `${knownUser.name}, всё сходится. Работаем дальше.`);
    }

    const parsed = parseMessage(text);

    if (parsed.type === "where_tool") {
      const tool = await findToolByNameOrAlias(parsed.toolName);
      if (!tool) return replyAndOk(res, chatId, toolNotFound(parsed.toolName));

      const location = await getToolLocation(tool.id);
      if (!location) return replyAndOk(res, chatId, toolNotFound(parsed.toolName));

      return replyAndOk(
        res,
        chatId,
        toolLocationReply({
          title: `${location.title} (${location.id})`,
          objectName: location.object_name,
          responsibleName: location.responsible_name,
          status: location.status
        })
      );
    }

    if (parsed.type === "where_all") {
      if (!canViewAll(knownUser)) return replyAndOk(res, chatId, permissionDenied());

      const tools = await listAllTools();
      const lines = tools.map(
        (tool) =>
          `— ${tool.title} (${tool.id}) · ${tool.object_name || "без объекта"} · ${tool.responsible_name || "свободен"} · ${tool.status}`
      );

      return replyAndOk(res, chatId, toolsListReply("Вот что у меня сейчас числится:", lines));
    }

    if (parsed.type === "where_mine") {
      const tools = await listMyTools(knownUser.id);
      const lines = tools.map(
        (tool) =>
          `— ${tool.title} (${tool.id}) · ${tool.object_name || "без объекта"} · ${tool.status}`
      );

      return replyAndOk(res, chatId, toolsListReply("Вот что сейчас записано за тобой:", lines));
    }

    if (parsed.type === "take_tool") {
      const tool = await findToolByNameOrAlias(parsed.toolName);
      if (!tool) return replyAndOk(res, chatId, toolNotFound(parsed.toolName));

      const result = await takeTool({
        toolId: tool.id,
        actorUserId: knownUser.id,
        currentObjectId: tool.current_object_id
      });

      if (result === "already_taken") {
        return replyAndOk(res, chatId, toolAlreadyTaken(`${tool.title} (${tool.id})`));
      }

      return replyAndOk(res, chatId, toolTaken(`${tool.title} (${tool.id})`));
    }

    if (parsed.type === "return_tool") {
      const tool = await findToolByNameOrAlias(parsed.toolName);
      if (!tool) return replyAndOk(res, chatId, toolNotFound(parsed.toolName));

      const result = await returnTool({
        toolId: tool.id,
        actorUserId: knownUser.id,
        currentObjectId: tool.current_object_id
      });

      if (result === "not_in_use") {
        return replyAndOk(res, chatId, toolNotInUse(`${tool.title} (${tool.id})`));
      }

      if (result === "held_by_other") {
        return replyAndOk(res, chatId, toolHeldByOther(`${tool.title} (${tool.id})`));
      }

      return replyAndOk(res, chatId, toolReturned(`${tool.title} (${tool.id})`));
    }

    if (parsed.type === "add_tool") {
      if (!canManageTools(knownUser)) return replyAndOk(res, chatId, permissionDenied());

      const base = await getBaseObject();
      const tool = await addTool({
        title: parsed.payload.title,
        aliases: parsed.payload.aliases,
        family: parsed.payload.family,
        toolType: parsed.payload.toolType,
        actorUserId: knownUser.id,
        baseObjectId: base.id
      });

      return replyAndOk(res, chatId, toolAdded(`${tool.title} (${tool.id})`));
    }

    if (parsed.type === "delete_tool") {
      if (!canManageTools(knownUser)) return replyAndOk(res, chatId, permissionDenied());

      const tool = await findToolByNameOrAlias(parsed.toolName);
      if (!tool) return replyAndOk(res, chatId, toolNotFound(parsed.toolName));

      const result = await deleteTool({
        toolId: tool.id,
        actorUserId: knownUser.id,
        currentObjectId: tool.current_object_id
      });

      if (result === "in_use") {
        return replyAndOk(res, chatId, toolDeleteBlocked(`${tool.title} (${tool.id})`));
      }

      return replyAndOk(res, chatId, toolDeleted(`${tool.title} (${tool.id})`));
    }

    if (parsed.type === "create_object") {
      if (!canManageObjects(knownUser)) return replyAndOk(res, chatId, permissionDenied());

      const object = await createObject(parsed.objectName);
      return replyAndOk(res, chatId, objectCreated(object.name));
    }

    if (parsed.type === "activate_object") {
      if (!canManageObjects(knownUser)) return replyAndOk(res, chatId, permissionDenied());

      const object = await findObjectByName(parsed.objectName);
      if (!object) return replyAndOk(res, chatId, objectNotFound(parsed.objectName));

      await activateObject(object.id);
      return replyAndOk(res, chatId, objectActivated(object.name));
    }

    if (parsed.type === "close_object") {
      if (!canManageObjects(knownUser)) return replyAndOk(res, chatId, permissionDenied());

      const object = await findObjectByName(parsed.objectName);
      if (!object) return replyAndOk(res, chatId, objectNotFound(parsed.objectName));

      const result = await closeObject(object.id);

      if (result === "base_forbidden") return replyAndOk(res, chatId, baseCloseForbidden());
      if (result === "already_closed") return replyAndOk(res, chatId, objectAlreadyClosed(object.name));

      return replyAndOk(res, chatId, objectClosed(object.name));
    }

    if (parsed.type === "return_all_from_object") {
      if (!canManageObjects(knownUser)) return replyAndOk(res, chatId, permissionDenied());

      const object = await findObjectByName(parsed.objectName);
      if (!object) return replyAndOk(res, chatId, objectNotFound(parsed.objectName));

      const base = await getBaseObject();
      const count = await returnAllToolsFromObject({
        objectId: object.id,
        baseObjectId: base.id,
        actorUserId: knownUser.id
      });

      return replyAndOk(res, chatId, bulkReturnedToBase(object.name, count));
    }

    if (parsed.type === "add_user") {
      if (!canManageUsers(knownUser)) return replyAndOk(res, chatId, permissionDenied());

      const user = await createUser(parsed.payload);
      const roleTitle = user.role === "prorab" ? "прораб" : "сотрудник";

      return replyAndOk(res, chatId, userAdded(user.name, user.telegram_username, roleTitle));
    }

    return replyAndOk(res, chatId, unknownCommand(knownUser.name));
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return res.status(500).json({ ok: false });
  }
});
