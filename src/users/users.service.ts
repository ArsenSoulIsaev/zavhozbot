import { query } from "../db.js";
import type { AuthUser } from "../types/index.js";

export async function getUserById(userId: number): Promise<AuthUser | null> {
  const result = await query<AuthUser>(
    `
    select id, telegram_id, name, role, is_verified, last_reauth_at
    from users
    where id = $1
    limit 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}
