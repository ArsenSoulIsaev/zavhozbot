export function greet(): string {
  return "Харе Кришна. Я на месте, порядок держу.";
}

export function askSecretWord(): string {
  return "Назови своё секретное слово. Без этого в кладовую учёта не пущу.";
}

export function authSuccess(name: string): string {
  return `${name}, признал тебя. Доступ открыл, всё учёл.`;
}

export function authFail(): string {
  return "Секретное слово не сошлось. Проверь спокойно и напиши ещё раз.";
}

export function notRegistered(): string {
  return "Тебя у меня в списке пока нет. Передам Арсену запрос на подтверждение.";
}

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
  return `${title} уже числится в работе. Инструмент один, а желающих обычно больше.`;
}

export function toolNotInUse(title: string): string {
  return `${title} и так уже отмечен как возвращённый.`;
}

export function toolHeldByOther(title: string): string {
  return `${title} числится не за тобой. Сначала разберёмся, у кого он на руках, потом всё выправим.`;
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

export function unknownCommand(): string {
  return "Смысл уловил не до конца. Напиши проще: «взял перф», «вернул болгарку» или «где шурик».";
}

export function permissionDenied(): string {
  return "На это у тебя полномочий нет. Тут нужен прораб или Арсен.";
}

export function toolAdded(title: string): string {
  return `${title} добавил в Базу. Теперь инструмент стоит на учёте как положено.`;
}

export function toolDeleted(title: string): string {
  return `${title} убрал из базы. Всё отметил в истории.`;
}

export function toolDeleteBlocked(title: string): string {
  return `${title} сейчас в работе. Пока инструмент не вернётся, удалять его нельзя.`;
}

export function objectNotFound(name: string): string {
  return `Объект «${name}» у меня не найден. Проверь название без суеты.`;
}

export function objectClosed(name: string): string {
  return `Объект «${name}» закрыл. Активной снова стала «База».`;
}

export function objectAlreadyClosed(name: string): string {
  return `Объект «${name}» уже был закрыт раньше.`;
}

export function baseCloseForbidden(): string {
  return "«Базу» закрывать нельзя. На то она и База, чтобы держать опору.";
}

export function allToolsReply(lines: string[]): string {
  if (!lines.length) {
    return "Пока инструментов в учёте не вижу.";
  }

  return ["Вот что у меня сейчас числится:", ...lines].join("\n");
}

export function bulkReturnedToBase(objectName: string, count: number): string {
  return `С объекта «${objectName}» вернул на Базу ${count} шт. Всё записал, хвостов не оставил.`;
}
