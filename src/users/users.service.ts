import * as bcrypt from "bcrypt";
import { query } from "../db.js";

export async function createUser(params: {
  name: string;
  telegramUsername: string;
  role: "prorab" | "employee";
  secretWord: string;
}) {
  const hash = await bcrypt.hash(params.secretWord, 10);

  const result = await query<{
    id: number;
    name: string;
    telegram_username: string;
    role: string;
  }>(
    `
    insert into users (
      name,
      telegram_username,
      role,
      secret_word_hash,
      is_verified
    )
    values ($1, $2, $3, $4, false)
    returning id, name, telegram_username, role
    `,
    [params.name, params.telegramUsername, params.role, hash]
  );

  return result.rows[0];
}
