export function permissionDenied(): string {
  return "На это у тебя полномочий нет. Тут нужен прораб или Арсен.";
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
  return `${params.title} сейчас числится на объекте «${params.objectName || "не указан"}», ответственный: ${params.responsibleName || "никто не назначен"}, статус: ${params.status}.`;
}

export function toolsListReply(title: string, lines: string[]): string {
  if (!lines.length) return `${title}\nПока пусто.`;

  return [title, ...lines].join("\n");
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

export function objectCreated(name: string): string {
  return `Объект «${name}» создал. Теперь его можно делать активным.`;
}

export function objectActivated(name: string): string {
  return `Объект «${name}» сделал активным.`;
}

export function objectClosed(name: string): string {
  return `Объект «${name}» закрыл. Активной снова стала «База».`;
}

export function objectAlreadyClosed(name: string): string {
  return `Объект «${name}» уже был закрыт раньше.`;
}

export function objectNotFound(name: string): string {
  return `Объект «${name}» у меня не найден. Проверь название без суеты.`;
}

export function baseCloseForbidden(): string {
  return "«Базу» закрывать нельзя. На то она и База, чтобы держать опору.";
}

export function bulkReturnedToBase(objectName: string, count: number): string {
  return `С объекта «${objectName}» вернул на Базу ${count} шт. Всё записал, хвостов не оставил.`;
}

export function userAdded(name: string, username: string, role: string): string {
  return `${name} (@${username}) добавлен, роль: ${role}. Теперь человек сможет пройти первую проверку.`;
}

export function unknownCommand(name: string): string {
  return `${name}, смысл уловил не до конца. Напиши проще.`;
}
