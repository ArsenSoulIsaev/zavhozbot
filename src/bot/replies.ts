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
