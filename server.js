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

app.get("/", (req, res) => {
  res.send("ZavhozBot is alive");
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const message = req.body.message;
    if (!message?.chat?.id || !message?.text) return;

    const chatId = message.chat.id;
    const text = message.text;

    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content:
            "Ты МахаЗавхоз. Отвечай по-русски. Коротко, живо, по-человечески. " +
            "Ты как доброжелательный завхоз: любишь порядок, говоришь просто. " +
            "Не говори 'операция выполнена'. Лучше: 'записал', 'отметил', 'принял'. " +
            "Пока что ты просто общаешься и помогаешь, без строгого учёта в базе."
        },
        {
          role: "user",
          content: text
        }
      ]
    });

    const answer = response.output_text || "Принял. Но мысль не сложилась, напиши ещё раз.";

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
