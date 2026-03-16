console.log("APP VERSION: webhook-v2-tools");

import express from "express";
import { config } from "./config.js";
import { webhookRouter } from "./bot/webhook.js";

const app = express();

app.use(express.json());
app.use(webhookRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

console.log("DATABASE_URL exists:", Boolean(process.env.DATABASE_URL));
console.log("DATABASE_URL preview:", process.env.DATABASE_URL?.slice(0, 80));

app.listen(config.port, () => {
  console.log(`МахаЗавхоз слушает порт ${config.port}`);
});
