export function toolNotFound(toolName: string): string {
  return `Не нахожу инструмент «${toolName}». Название надо поточнее, чтобы в учёте не было тумана.`;
}

export function toolTaken(title: string): string {
  return `${title} записал за тобой. Пользуйся аккуратно и потом верни по-человечески.`;
}

export function toolReturned(title: string): string {
  return `${title} принял обратно. Благодарю за аккуратность, так держится порядок.`;
}

export function toolAlreadyTaken(title: string): string {
  return `${title} уже числится в работе. Инструмент один, а рук вокруг много.`;
}

export function toolNotInUse(title: string): string {
  return `${title} и так уже отмечен как возвращённый.`;
}

export function toolHeldByOther(title: string): string {
  return `${title} числится не за тобой. Сначала разберёмся, у кого он на руках.`;
}

export function toolLocationReply(params: {
  title: string;
  objectName: string | null;
  responsibleName: string | null;
  status: string;
}): string {
  const objectPart = params.objectName || "объект не указан";
  const responsiblePart = params.responsibleName || "никто не назначен";

  return `${params.title} сейчас числится на объекте «${objectPart}», ответственный: ${responsiblePart}, статус: ${params.status}.`;
}

export function allToolsReply(lines: string[]): string {
  if (!lines.length) {
    return "Пока инструментов в учёте не вижу.";
  }

  return ["Вот что у меня сейчас числится:", ...lines].join("\n");
}

export function unknownCommand(name: string): string {
  return `${name}, смысл уловил не до конца. Напиши проще: «где перф», «я взял перф», «я вернул перф», «где всё».`;
}
