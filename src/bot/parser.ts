export type ParsedAction =
  | { type: "auth_secret"; secret: string }
  | { type: "where_tool"; toolName: string }
  | { type: "take_tool"; toolName: string }
  | { type: "return_tool"; toolName: string }
  | { type: "unknown" };

function cleanToolName(value: string): string {
  return value
    .trim()
    .replace(/^я\s+/i, "")
    .replace(/\s+/g, " ");
}

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
      toolName: cleanToolName(raw.slice(4))
    };
  }

  if (lower.startsWith("взял ")) {
    return {
      type: "take_tool",
      toolName: cleanToolName(raw.slice(5))
    };
  }

  if (lower.startsWith("я взял ")) {
    return {
      type: "take_tool",
      toolName: cleanToolName(raw.slice(7))
    };
  }

  if (lower.startsWith("забрал ")) {
    return {
      type: "take_tool",
      toolName: cleanToolName(raw.slice(7))
    };
  }

  if (lower.startsWith("я забрал ")) {
    return {
      type: "take_tool",
      toolName: cleanToolName(raw.slice(9))
    };
  }

  if (lower.startsWith("вернул ")) {
    return {
      type: "return_tool",
      toolName: cleanToolName(raw.slice(7))
    };
  }

  if (lower.startsWith("я вернул ")) {
    return {
      type: "return_tool",
      toolName: cleanToolName(raw.slice(9))
    };
  }

  return { type: "unknown" };
}
