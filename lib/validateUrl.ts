export type UrlValidationResult =
  | { ok: true; url: URL }
  | { ok: false; error: string };

export function validateArticleUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, error: "URL обязателен" };
  }

  try {
    const url = new URL(trimmed);

    if (!["http:", "https:"].includes(url.protocol)) {
      return {
        ok: false,
        error: "Поддерживаются только http:// и https://",
      };
    }

    return { ok: true, url };
  } catch {
    return { ok: false, error: "Некорректный URL" };
  }
}

export function isValidArticleUrl(input: string) {
  return validateArticleUrl(input).ok;
}
