export type UserRole = "arsen" | "prorab" | "employee";

export interface AuthUser {
  id: number;
  telegram_id: number | null;
  name: string;
  role: UserRole;
  is_verified: boolean;
  last_reauth_at: string | null;
}
