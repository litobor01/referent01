import { runAiActionStream, type AiAction } from "@/lib/aiActions";
import { ERROR_CODES } from "@/lib/errors";
import type { ParsedArticle } from "@/lib/parseArticle";

export type ProcessAction = AiAction;

const VALID_ACTIONS: ProcessAction[] = ["summary", "theses", "telegram"];

export function isProcessAction(value: string): value is ProcessAction {
  return VALID_ACTIONS.includes(value as ProcessAction);
}

export function getProcessActionError() {
  return ERROR_CODES.ACTION_INVALID;
}

export async function processArticleStream(
  action: ProcessAction,
  article: ParsedArticle,
  sourceUrl: string,
) {
  return runAiActionStream(action, article, sourceUrl);
}
