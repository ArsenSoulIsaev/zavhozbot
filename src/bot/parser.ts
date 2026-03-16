import express from "express";
import { sendTelegramMessage } from "./telegram.js";
import { parseMessage } from "./parser.js";
import {
  allToolsReply,
  toolAlreadyTaken,
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
  findUserByTelegramId,
  findUserByTelegramUsername,
  needsReauth,
  touchReauth,
  verifySecretWord
} from "../auth/auth.service.js";
import {
  findToolByNameOrAlias,
  getToolLocation,
  listAllTools,
  returnTool,
  takeTool
} from "../tools/tools.service.js";

export const webhookRouter = express.Router();

const pendingAuth = new Map<number, { userId: number; name: string }>();

async function replyAndOk(res: express.Response, chatId: number, text: string) {
  console.log("BOT REPLY:", text);
  await sendTelegramMessage(chatId, text);
  return res.status(200).json({ ok: true });
}

webhookRouter.post("/telegram/webhook", async (req, res) => {
  try {
    const message = req.body?.message;
    const text = message?.text?.trim() || "";
    const from = message?.from;
    const chatId = message?.chat?.id;

    console.log("INCOMING TEXT:", text);

    if (!from?.id || !chatId) {
      return res.status(200).json({ ok: true });
    }

    const telegramId = from.id;
    const username = from.username || "";

    let knownUser = await findUserByTelegramId(telegramId);
    console.log("KNOWN USER:", knownUser);

    if (!knownUser) {
      const pending = pendingAuth.get(telegramId);

      if (pending) {
        const ok = await verifySecretWord(pending.userId, text);

        if (!ok) {
          return replyAndOk(
            res,
            chatId,
            "Секретное слово не сошлось. Проверь спокойно и напиши ещё раз."
          );
        }

        await bindTelegramId(pending.userId, telegramId);
        pendingAuth.delete(telegramId);

        return replyAndOk(
          res,
          chatId,
          `${pending.name}, признал тебя. Доступ открыл, всё учёл.`
        );
      }

      if (!username) {
        return replyAndOk(
          res,
          chatId,
          "У тебя в Telegram не вижу username. Пусть Арсен сначала заведёт тебя правильно."
        );
      }

      const candidate = await findUserByTelegramUsername(username);

      if (!candidate) {
        return replyAndOk(
          res,
          chatId,
          "Тебя у меня в списке пока нет. Пусть Арсен добавит тебя в систему."
        );
      }

      pendingAuth.set(telegramId, { userId: candidate.id, name: candidate.name });

      return replyAndOk(
        res,
        chatId,
        "Назови своё секретное слово. Без этого в кладовую учёта не пущу."
      );
    }

    if (needsReauth(knownUser.last_reauth_at)) {
      const pending = pendingAuth.get(telegramId);

      if (!pending) {
        pendingAuth.set(telegramId, { userId: knownUser.id, name: knownUser.name });

        return replyAndOk(
          res,
          chatId,
          `Хари Хари, ${knownUser.name}. Пора освежить память. Назови секретное слово.`
        );
      }

      const ok = await verifySecretWord(knownUser.id, text);

      if (!ok) {
        return replyAndOk(
          res,
          chatId,
          "Секретное слово не сошлось. Проверь спокойно и напиши ещё раз."
        );
      }

      pendingAuth.delete(telegramId);
      await touchReauth(knownUser.id);

      return replyAndOk(
        res,
        chatId,
        `${knownUser.name}, всё сходится. Работаем дальше.`
      );
    }

    const parsed = parseMessage(text);
    console.log("PARSED ACTION:", parsed);

    if (parsed.type === "where_tool") {
      const tool = await findToolByNameOrAlias(parsed.toolName);
      console.log("FOUND TOOL:", tool);

      if (!tool) {
        return replyAndOk(res, chatId, toolNotFound(parsed.toolName));
      }

      const location = await getToolLocation(tool.id);
      console.log("TOOL LOCATION:", location);

      if (!location) {
        return replyAndOk(res, chatId, toolNotFound(parsed.toolName));
      }

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
      const tools = await listAllTools();
      console.log("ALL TOOLS COUNT:", tools.length);

      const lines = tools.map(
        (tool) =>
          `— ${tool.title} (${tool.id}) · объект: ${tool.object_name || "не указан"} · ответственный: ${tool.responsible_name || "нет"} · статус: ${tool.status}`
      );

      return replyAndOk(res, chatId, allToolsReply(lines));
    }

    if (parsed.type === "take_tool") {
      const tool = await findToolByNameOrAlias(parsed.toolName);
      console.log("FOUND TOOL:", tool);

      if (!tool) {
        return replyAndOk(res, chatId, toolNotFound(parsed.toolName));
      }

      const result = await takeTool({
        toolId: tool.id,
        actorUserId: knownUser.id,
        currentObjectId: tool.current_object_id
      });

      console.log("TAKE RESULT:", result);

      if (result === "already_taken") {
        return replyAndOk(res, chatId, toolAlreadyTaken(`${tool.title} (${tool.id})`));
      }

      return replyAndOk(res, chatId, toolTaken(`${tool.title} (${tool.id})`));
    }

    if (parsed.type === "return_tool") {
      const tool = await findToolByNameOrAlias(parsed.toolName);
      console.log("FOUND TOOL:", tool);

      if (!tool) {
        return replyAndOk(res, chatId, toolNotFound(parsed.toolName));
      }

      const result = await returnTool({
        toolId: tool.id,
        actorUserId: knownUser.id,
        currentObjectId: tool.current_object_id
      });

      console.log("RETURN RESULT:", result);

      if (result === "not_in_use") {
        return replyAndOk(res, chatId, toolNotInUse(`${tool.title} (${tool.id})`));
      }

      if (result === "held_by_other") {
        return replyAndOk(res, chatId, toolHeldByOther(`${tool.title} (${tool.id})`));
      }

      return replyAndOk(res, chatId, toolReturned(`${tool.title} (${tool.id})`));
    }

    return replyAndOk(res, chatId, unknownCommand(knownUser.name));
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return res.status(500).json({ ok: false });
  }
});
