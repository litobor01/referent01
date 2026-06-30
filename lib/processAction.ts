import { runAiAction, type AiAction } from "@/lib/aiActions";
import type { ParsedArticle } from "@/lib/parseArticle";

export type ProcessAction = AiAction;

const VALID_ACTIONS: ProcessAction[] = ["summary", "theses", "telegram"];

export function isProcessAction(value: string): value is ProcessAction {
  return VALID_ACTIONS.includes(value as ProcessAction);
}

export function getProcessActionError() {
  return "Укажите действие: summary, theses или telegram";
}

export async function processArticle(
  action: ProcessAction,
  article: ParsedArticle,
  sourceUrl: string,
) {
  const result = await runAiAction(action, article, sourceUrl);

  return { result };
}
