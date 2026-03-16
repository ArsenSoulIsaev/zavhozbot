export type ParsedAction =
  | { type: "where_tool"; toolName: string }
  | { type: "where_all" }
  | { type: "where_mine" }
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
  | { type: "create_object"; objectName: string }
  | { type: "activate_object"; objectName: string }
  | { type: "close_object"; objectName: string }
  | { type: "return_all_from_object"; objectName: string }
  | {
      type: "add_user";
      payload: {
        name: string;
        telegramUsername: string;
        role: "prorab" | "employee";
        secretWord: string;
      };
    }
  | { type: "unknown" };

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function parseAddTool(raw: string) {
  const body = raw.replace(/^добавь инструмент\s+/i, "").trim();
  const parts = body.split("|").map((part) => clean(part));

  if (!parts[0]) return null;

  return {
    title: parts[0],
    aliases:
      parts[1]
        ?.split(",")
        .map((x) => clean(x).toLowerCase())
        .filter(Boolean) || [],
    family: parts[2] || null,
    toolType: parts[3] || null
  };
}

function parseAddUser(raw: string) {
  const body = raw.replace(/^добавь сотрудника\s+/i, "").trim();
  const parts = body.split("|").map((part) => clean(part));

  if (parts.length < 4) return null;

  const roleRaw = parts[2].toLowerCase();

  let role: "prorab" | "employee";
  if (roleRaw === "прораб") {
    role = "prorab";
  } else if (roleRaw === "сотрудник") {
    role = "employee";
  } else {
    return null;
  }

  return {
    name: parts[0],
    telegramUsername: parts[1].replace(/^@/, ""),
    role,
    secretWord: parts[3]
  };
}

export function parseMessage(text: string): ParsedAction {
  const raw = clean(text);
  const lower = raw.toLowerCase();

  if (!raw) return { type: "unknown" };

  if (lower === "где всё") return { type: "where_all" };
  if (lower === "где моё") return { type: "where_mine" };

  if (lower.startsWith("где ")) {
    return { type: "where_tool", toolName: clean(raw.slice(4)) };
  }

  if (lower.startsWith("взял ")) {
    return { type: "take_tool", toolName: clean(raw.slice(5)) };
  }

  if (lower.startsWith("я взял ")) {
    return { type: "take_tool", toolName: clean(raw.slice(7)) };
  }

  if (lower.startsWith("вернул ")) {
    return { type: "return_tool", toolName: clean(raw.slice(7)) };
  }

  if (lower.startsWith("я вернул ")) {
    return { type: "return_tool", toolName: clean(raw.slice(9)) };
  }

  if (lower.startsWith("добавь инструмент ")) {
    const payload = parseAddTool(raw);
    return payload ? { type: "add_tool", payload } : { type: "unknown" };
  }

  if (lower.startsWith("удали инструмент ")) {
    return { type: "delete_tool", toolName: clean(raw.slice("удали инструмент ".length)) };
  }

  if (lower.startsWith("создай объект ")) {
    return { type: "create_object", objectName: clean(raw.slice("создай объект ".length)) };
  }

  if (lower.startsWith("сделай объект активным ")) {
    return { type: "activate_object", objectName: clean(raw.slice("сделай объект активным ".length)) };
  }

  if (lower.startsWith("закрой объект ")) {
    return { type: "close_object", objectName: clean(raw.slice("закрой объект ".length)) };
  }

  if (lower.startsWith("забрали всё с объекта ")) {
    return {
      type: "return_all_from_object",
      objectName: clean(raw.slice("забрали всё с объекта ".length))
    };
  }

  if (lower.startsWith("добавь сотрудника ")) {
    const payload = parseAddUser(raw);
    return payload ? { type: "add_user", payload } : { type: "unknown" };
  }

  return { type: "unknown" };
}
