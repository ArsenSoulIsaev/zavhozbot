import express from "express";
import { sendTelegramMessage } from "./telegram.js";

export const webhookRouter = express.Router();

webhookRouter.post("/telegram/webhook", async (req, res) => {
  try {
    const message = req.body?.message;
    const from = message?.from;
    const chatId = message?.chat?.id;

    console.log("WEBHOOK BODY:", JSON.stringify(req.body));

    if (!from?.id || !chatId) {
      return res.status(200).json({ ok: true });
    }

    await sendTelegramMessage(chatId, "Харе Кришна. Я слышу тебя.");
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return res.status(500).json({ ok: false });
  }
});
