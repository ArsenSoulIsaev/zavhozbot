import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  arsenName: process.env.ARSEN_NAME || "Арсен",
  reauthDays: Number(process.env.REAUTH_DAYS || 7)
};

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL не задан");
}
