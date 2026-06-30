import { ERROR_CODES, type ErrorCode } from "@/lib/errors";

export type UrlValidationResult =
  | { ok: true; url: URL }
  | { ok: false; code: ErrorCode };

export function validateArticleUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, code: ERROR_CODES.URL_REQUIRED };
  }

  try {
    const url = new URL(trimmed);

    if (!["http:", "https:"].includes(url.protocol)) {
      return { ok: false, code: ERROR_CODES.URL_PROTOCOL_INVALID };
    }

    return { ok: true, url };
  } catch {
    return { ok: false, code: ERROR_CODES.URL_INVALID };
  }
}

export function isValidArticleUrl(input: string) {
  return validateArticleUrl(input).ok;
}
