import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const TOKEN = process.env.TELEGRAM_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const users = new Map();

// Временный список пользователей.
// Потом перенесём это в базу.
const preregisteredUsers = {
  arsen_soul_isaev: { secret: "Shief", role: "Арсен" },
  volodya: { secret: "volodya123", role: "Сотрудник" },
  petya: { secret: "petya123", role: "Сотрудник" }
};

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

app.get("/", (req, res) => {
  res.send("ZavhozBot is alive");
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const message = req.body.message;
    if (!message?.chat?.id || !message?.from?.id || !message?.text) return;

    const chatId = message.chat.id;
    const telegramId = message.from.id;
    const username = normalize(message.from.username);
    const text = message.text.trim();

    let user = users.get(telegramId);

    // Если человека ещё не знаем по Telegram ID
    if (!user) {
      const prereg = preregisteredUsers[username];

      if (!prereg) {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Тебя в списке пока не вижу. Пусть Арсен сначала занесёт тебя в систему."
          })
        });
        return;
      }

      // Первый вход: ждём секретное слово
      if (normalize(text) !== normalize(prereg.secret)) {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Назови секретное слово. Без этого доступ к учёту не открываю."
          })
        });
        return;
      }

      // Секретное слово верное — привязываем Telegram ID
      user = {
        telegramId,
        username,
        role: prereg.role,
        verified: true
      };

      users.set(telegramId, user);

      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Признал тебя, ${username}. Доступ открыл, всё учёл.`
        })
      });
      return;
    }

    // Уже проверенный пользователь — можно общаться дальше
    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content:
            "Ты МахаЗавхоз. Отвечай по-русски. Коротко, живо, по-человечески. " +
            "Ты доброжелательный завхоз, любишь порядок. " +
            "Пользователь уже прошёл идентификацию. " +
            "Не говори 'операция выполнена'. Используй живые фразы: 'записал', 'отметил', 'принял'."
        },
        {
          role: "user",
          content: `Роль пользователя: ${user.role}. Username: ${user.username}. Сообщение: ${text}`
        }
      ]
    });

    const answer = response.output_text || "Принял. Напиши ещё раз, если нужно уточнить.";

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: answer
      })
    });
  } catch (error) {
    console.error(error);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on ${PORT}`);
});
