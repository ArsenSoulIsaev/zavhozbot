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
