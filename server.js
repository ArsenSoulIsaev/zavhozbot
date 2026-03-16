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

const tools = [
  {
    id: 485,
    name: "Шуруповёрт Makita",
    aliases: ["шуруповерт", "шуруповёрт", "шурик", "макита"],
    holder: null,
    object: "База",
  },
  {
    id: 322,
    name: "Перфоратор Bosch",
    aliases: ["перфоратор", "перф", "bosch"],
    holder: null,
    object: "База",
  },
  {
    id: 211,
    name: "Миксер DLT",
    aliases: ["миксер"],
    holder: null,
    object: "База",
  },
  {
    id: 190,
    name: "Болгарка DeWalt",
    aliases: ["болгарка"],
    holder: null,
    object: "База",
  },
];

const preregisteredUsers = {
  arsen_soul_isaev: { secret: "Chief", role: "Арсен" },
  volodya: { secret: "volodya123", role: "Сотрудник" },
  Makar108om: { secret: "Вжик", role: "Прораб" },
};

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function findToolByText(text) {
  const t = normalize(text);

  return tools.find((tool) => {
    if (t.includes(String(tool.id))) return true;
    if (normalize(tool.name).includes(t) || t.includes(normalize(tool.name))) return true;
    return tool.aliases.some((alias) => t.includes(normalize(alias)));
  });
}

function handleToolCommand(text, user) {
  const t = normalize(text);
  const tool = findToolByText(text);

  if (!tool) return null;

  if (t.includes("где")) {
    if (tool.holder) {
      return `${tool.name} (${tool.id}) сейчас у ${tool.holder}, объект: ${tool.object}.`;
    }
    return `${tool.name} (${tool.id}) сейчас на объекте ${tool.object}. Ответственный не назначен.`;
  }

  if (t.includes("взял") || t.includes("забрал") || t.includes("беру")) {
    if (tool.holder) {
      return `${tool.name} (${tool.id}) уже записан за ${tool.holder}. Два хозяина у одного инструмента — это беспорядок.`;
    }

    tool.holder = user.username;
    tool.object = "На руках";
    return `Записал: ${user.username} взял ${tool.name} (${tool.id}).`;
  }

  if (t.includes("вернул") || t.includes("сдал")) {
    if (!tool.holder) {
      return `${tool.name} (${tool.id}) и так не числится на руках.`;
    }

    if (tool.holder !== user.username && user.role !== "Арсен") {
      return `${tool.name} (${tool.id}) записан не на тебя, а на ${tool.holder}. Тут нужна точность.`;
    }

    tool.holder = null;
    tool.object = "База";
    return `Принял ${tool.name} (${tool.id}) обратно на Базу. Благодарю за аккуратность.`;
  }

  return null;
}

async function sendTelegramMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
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

    if (!user) {
      const prereg = preregisteredUsers[username];

      if (!prereg) {
        await sendTelegramMessage(
          chatId,
          "Тебя в списке пока не вижу. Пусть Арсен сначала занесёт тебя в систему."
        );
        return;
      }

      if (normalize(text) !== normalize(prereg.secret)) {
        await sendTelegramMessage(
          chatId,
          "Назови секретное слово. Без этого доступ к учёту не открываю."
        );
        return;
      }

      user = {
        telegramId,
        username,
        role: prereg.role,
        verified: true,
      };

      users.set(telegramId, user);

      await sendTelegramMessage(
        chatId,
        `Признал тебя, ${username}. Доступ открыл, всё учёл.`
      );
      return;
    }

    const toolReply = handleToolCommand(text, user);

    if (toolReply) {
      await sendTelegramMessage(chatId, toolReply);
      return;
    }

    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content:
            "Ты МахаЗавхоз. Отвечай по-русски, коротко, живо, по-человечески. " +
            "Ты доброжелательный завхоз, любишь порядок. " +
            "Пользователь уже прошёл идентификацию. " +
            "Не говори 'операция выполнена'. Используй живые фразы: 'записал', 'отметил', 'принял'. " +
            "Если сообщение похоже на учёт инструмента, но система его не распознала, не выдумывай данные.",
        },
        {
          role: "user",
          content: `Роль пользователя: ${user.role}. Username: ${user.username}. Сообщение: ${text}`,
        },
      ],
    });

    const answer =
      response.output_text || "Принял. Напиши ещё раз, если нужно уточнить.";

    await sendTelegramMessage(chatId, answer);
  } catch (error) {
    console.error(error);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on ${PORT}`);
});
