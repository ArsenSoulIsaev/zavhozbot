import { config } from "../config.js";

export async function sendTelegramMessage(
  chatId: number,
  text: string
) {
  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}
