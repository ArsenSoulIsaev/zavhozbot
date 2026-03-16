import express from "express";
import { sendTelegramMessage } from "./telegram.js";
import {
  findUserByTelegramId,
  findUserByTelegramUsername,
  bindTelegramId,
  verifySecretWord
} from "../auth/auth.service.js";

export const webhookRouter = express.Router();

webhookRouter.post("/telegram/webhook", async (req, res) => {
  try {
    const message = req.body?.message;
    const text = message?.text?.trim();
    const from = message?.from;
    const chatId = message?.chat?.id;

    if (!from?.id || !chatId) {
      return res.status(200).json({ ok: true });
    }

    const telegramId = from.id;
    const username = from.username || "";

    // 1. ищем пользователя по telegram_id
    let user = await findUserByTelegramId(telegramId);

    // 2. если нет — ищем по username
    if (!user && username) {
      const byUsername = await findUserByTelegramUsername(username);

      if (byUsername) {
        await bindTelegramId(byUsername.id, telegramId);
        user = byUsername;
      }
    }

    // 3. если пользователя нет
    if (!user) {
      await sendTelegramMessage(
        chatId,
        "Харе Кришна. Я тебя пока не знаю. Арсен должен добавить тебя в систему."
      );
      return res.status(200).json({ ok: true });
    }

    // 4. если не прошёл проверку
    if (!user.is_verified) {
      if (!text) {
        await sendTelegramMessage(
          chatId,
          "Назови своё секретное слово."
        );
        return res.status(200).json({ ok: true });
      }

      const ok = await verifySecretWord(user.id, text);

      if (!ok) {
        await sendTelegramMessage(
          chatId,
          "Секретное слово не подошло."
        );
        return res.status(200).json({ ok: true });
      }

      await sendTelegramMessage(
        chatId,
        "Принял. Доступ открыт."
      );

      return res.status(200).json({ ok: true });
    }

    // 5. если пользователь уже авторизован
    await sendTelegramMessage(
      chatId,
      "Харе Кришна. Я на месте, порядок держу."
    );

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return res.status(500).json({ ok: false });
  }
});
