import bcrypt from "bcrypt";
import { query } from "../db.js";
import { config } from "../config.js";
import type { AuthUser } from "../types/index.js";

export async function findUserByTelegramId(telegramId: number): Promise<AuthUser | null> {
  const result = await query<AuthUser>(
    `select id, telegram_id, name, role, is_verified, last_reauth_at
     from users
     where telegram_id = $1
     limit 1`,
    [telegramId]
  );

  return result.rows[0] || null;
}

export async function findUserByTelegramUsername(username: string): Promise<AuthUser | null> {
  const result = await query<AuthUser>(
    `
    select id, telegram_id, name, role, is_verified, last_reauth_at
    from users
    where lower(telegram_username) = lower($1)
    limit 1
    `,
    [username]
  );

  return result.rows[0] || null;
}

export async function verifySecretWord(userId: number, secretWord: string): Promise<boolean> {
  const result = await query<{ secret_word_hash: string }>(
    `select secret_word_hash from users where id = $1 limit 1`,
    [userId]
  );

  const row = result.rows[0];
  if (!row) return false;

  return bcrypt.compare(secretWord, row.secret_word_hash);
}

export async function bindTelegramId(userId: number, telegramId: number): Promise<void> {
  await query(
    `update users
     set telegram_id = $1, is_verified = true, last_reauth_at = now()
     where id = $2`,
    [telegramId, userId]
  );
}

export function needsReauth(lastReauthAt: string | null): boolean {
  if (!lastReauthAt) return true;

  const last = new Date(lastReauthAt).getTime();
  const now = Date.now();
  const diffDays = (now - last) / (1000 * 60 * 60 * 24);

  return diffDays >= config.reauthDays;
}

export async function touchReauth(userId: number): Promise<void> {
  await query(
    `update users set last_reauth_at = now() where id = $1`,
    [userId]
  );
}
