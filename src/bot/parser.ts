export type ParsedAction =
  | { type: "auth_secret"; secret: string }
  | { type: "where_tool"; toolName: string }
  | { type: "take_tool"; toolName: string }
  | { type: "return_tool"; toolName: string }
  | { type: "unknown" };

export function parseMessage(text: string): ParsedAction {
  const raw = text.trim();
  const lower = raw.toLowerCase();

  if (!raw) return { type: "unknown" };

  if (lower.startsWith("секретное слово ")) {
    return {
      type: "auth_secret",
      secret: raw.slice("секретное слово ".length).trim()
    };
  }

  if (lower.startsWith("где ")) {
    return {
      type: "where_tool",
      toolName: raw.slice(4).trim()
    };
  }

  if (lower.startsWith("взял ")) {
    return {
      type: "take_tool",
      toolName: raw.slice(5).trim()
    };
  }

  if (lower.startsWith("вернул ")) {
    return {
      type: "return_tool",
      toolName: raw.slice(7).trim()
    };
  }

  return { type: "unknown" };
}
