export type UserRole = "arsen" | "prorab" | "employee";

export interface TelegramMessage {
  update_id: number;
  message?: {
    message_id: number;
    date: number;
    text?: string;
    chat: {
      id: number;
      type: string;
    };
    from?: {
      id: number;
      is_bot: boolean;
      first_name?: string;
      username?: string;
    };
  };
}

export interface AuthUser {
  id: number;
  telegram_id: number | null;
  name: string;
  role: UserRole;
  is_verified: boolean;
  last_reauth_at: string | null;
}
