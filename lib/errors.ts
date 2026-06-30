export const ERROR_CODES = {
  URL_REQUIRED: "URL_REQUIRED",
  URL_INVALID: "URL_INVALID",
  URL_PROTOCOL_INVALID: "URL_PROTOCOL_INVALID",
  ARTICLE_FETCH_FAILED: "ARTICLE_FETCH_FAILED",
  ARTICLE_CONTENT_EMPTY: "ARTICLE_CONTENT_EMPTY",
  ACTION_INVALID: "ACTION_INVALID",
  AI_FAILED: "AI_FAILED",
  AI_CONFIG_ERROR: "AI_CONFIG_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  URL_REQUIRED: "Укажите ссылку на статью.",
  URL_INVALID: "Введите корректный URL (http:// или https://).",
  URL_PROTOCOL_INVALID: "Поддерживаются только ссылки http:// и https://.",
  ARTICLE_FETCH_FAILED: "Не удалось загрузить статью по этой ссылке.",
  ARTICLE_CONTENT_EMPTY:
    "Не удалось найти текст статьи на этой странице. Попробуйте другую ссылку.",
  ACTION_INVALID: "Выберите одно из доступных действий.",
  AI_FAILED:
    "Не удалось получить ответ от AI. Попробуйте ещё раз через несколько секунд.",
  AI_CONFIG_ERROR:
    "Сервис AI временно недоступен. Проверьте настройки и перезапустите приложение.",
  NETWORK_ERROR:
    "Не удалось связаться с сервером. Проверьте подключение к интернету.",
  UNKNOWN: "Что-то пошло не так. Попробуйте ещё раз.",
};

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode) {
    super(code);
    this.name = "AppError";
    this.code = code;
  }
}

export function getErrorMessage(code?: string | null) {
  if (code && code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[code as ErrorCode];
  }

  return ERROR_MESSAGES.UNKNOWN;
}

export function getErrorStatus(code: ErrorCode) {
  switch (code) {
    case ERROR_CODES.URL_REQUIRED:
    case ERROR_CODES.URL_INVALID:
    case ERROR_CODES.URL_PROTOCOL_INVALID:
    case ERROR_CODES.ACTION_INVALID:
    case ERROR_CODES.ARTICLE_CONTENT_EMPTY:
      return 400;
    case ERROR_CODES.ARTICLE_FETCH_FAILED:
    case ERROR_CODES.NETWORK_ERROR:
      return 502;
    case ERROR_CODES.AI_CONFIG_ERROR:
      return 503;
    default:
      return 500;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return new AppError(ERROR_CODES.ARTICLE_FETCH_FAILED);
    }

    if (error.message.includes("OPENAI_API_KEY")) {
      return new AppError(ERROR_CODES.AI_CONFIG_ERROR);
    }
  }

  return new AppError(ERROR_CODES.UNKNOWN);
}

export function createErrorResponse(error: unknown) {
  const appError = toAppError(error);

  return {
    status: getErrorStatus(appError.code),
    body: { code: appError.code },
  };
}
