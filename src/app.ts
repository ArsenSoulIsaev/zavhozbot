import express from "express";
import { config } from "./config.js";
import { webhookRouter } from "./bot/webhook.js";

const app = express();

app.use(express.json());
app.use(webhookRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(config.port, () => {
  console.log(`МахаЗавхоз слушает порт ${config.port}`);
});
