import express from "express";

const app = express();
app.use(express.json());

const TOKEN = process.env.TELEGRAM_TOKEN;
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("ZavhozBot is alive");
});

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.message;

    if (message?.chat?.id) {
      const chatId = message.chat.id;

      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Я на связи. Завхоз слушает."
        })
      });
    }

    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(200);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on ${PORT}`);
});
