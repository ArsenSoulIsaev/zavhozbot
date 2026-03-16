import express from "express";
import { sendTelegramMessage } from "./telegram.js";
import {
  bindTelegramId,
  findUserByTelegramId,
  findUserByTelegramUsername,
  needsReauth,
  touchReauth,
  verifySecretWord
} from "../auth/auth.service.js";

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

    console.log("WEBHOOK BODY:", JSON.stringify(req.body));

    if (!from?.id || !chatId) {
      return res.status(200).json({ ok: true });
    }

    const telegramId = from.id;
    const username = from.username || "";

    let knownUser = await findUserByTelegramId(telegramId);

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

    return replyAndOk(
      res,
      chatId,
      `Харе Кришна, ${knownUser.name}. Я на месте, порядок держу.`
    );
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return res.status(500).json({ ok: false });
  }
});
