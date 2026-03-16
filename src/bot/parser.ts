export type ParsedAction =
  | { type: "where_tool"; toolName: string }
  | { type: "where_all" }
  | { type: "take_tool"; toolName: string }
  | { type: "return_tool"; toolName: string }
  | { type: "unknown" };

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function parseMessage(text: string): ParsedAction {
  const raw = clean(text);
  const lower = raw.toLowerCase();

  if (!raw) return { type: "unknown" };

  if (lower === "где всё") {
    return { type: "where_all" };
  }

  if (lower.startsWith("где ")) {
    return {
      type: "where_tool",
      toolName: clean(raw.slice(4))
    };
  }

  if (lower.startsWith("взял ")) {
    return {
      type: "take_tool",
      toolName: clean(raw.slice(5))
    };
  }

  if (lower.startsWith("я взял ")) {
    return {
      type: "take_tool",
      toolName: clean(raw.slice(7))
    };
  }

  if (lower.startsWith("вернул ")) {
    return {
      type: "return_tool",
      toolName: clean(raw.slice(7))
    };
  }

  if (lower.startsWith("я вернул ")) {
    return {
      type: "return_tool",
      toolName: clean(raw.slice(9))
    };
  }

  return { type: "unknown" };
}
