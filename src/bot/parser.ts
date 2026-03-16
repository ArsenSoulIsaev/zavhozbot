export type ParsedAction =
  | { type: "auth_secret"; secret: string }
  | { type: "where_tool"; toolName: string }
  | { type: "where_all" }
  | { type: "take_tool"; toolName: string }
  | { type: "return_tool"; toolName: string }
  | {
      type: "add_tool";
      payload: {
        title: string;
        aliases: string[];
        family: string | null;
        toolType: string | null;
      };
    }
  | { type: "delete_tool"; toolName: string }
  | { type: "close_object"; objectName: string }
  | { type: "return_all_from_object"; objectName: string }
  | { type: "unknown" };

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function cleanToolName(value: string): string {
  return clean(value).replace(/^я\s+/i, "");
}

/*
Формат для добавления пока сделаем простой и понятный:
добавь инструмент Перфоратор Makita | перф, перфоратор | электро | перфораторы

где:
1) title
2) aliases через запятую
3) family
4) toolType
*/
function parseAddTool(raw: string) {
  const body = raw.replace(/^добавь инструмент\s+/i, "").trim();
  const parts = body.split("|").map((part) => clean(part));

  if (!parts[0]) return null;

  const title = parts[0];
  const aliases =
    parts[1]
      ?.split(",")
      .map((x) => clean(x).toLowerCase())
      .filter(Boolean) || [];

  const family = parts[2] || null;
  const toolType = parts[3] || null;

  return {
    title,
    aliases,
    family,
    toolType
  };
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

  if (lower === "где всё") {
    return { type: "where_all" };
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

  if (lower.startsWith("добавь инструмент ")) {
    const payload = parseAddTool(raw);
    if (!payload) return { type: "unknown" };

    return {
      type: "add_tool",
      payload
    };
  }

  if (lower.startsWith("удали инструмент ")) {
    return {
      type: "delete_tool",
      toolName: clean(raw.slice("удали инструмент ".length))
    };
  }

  if (lower.startsWith("закрой объект ")) {
    return {
      type: "close_object",
      objectName: clean(raw.slice("закрой объект ".length))
    };
  }

  if (lower.startsWith("забрали всё с объекта ")) {
    return {
      type: "return_all_from_object",
      objectName: clean(raw.slice("забрали всё с объекта ".length))
    };
  }

  return { type: "unknown" };
}
