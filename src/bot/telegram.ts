import { config } from "../config.js";

export async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;

  console.log("SEND TELEGRAM:", {
    chatId,
    hasToken: Boolean(config.telegramBotToken),
    url
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("TELEGRAM SEND ERROR:", response.status, body);
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
  }
}
