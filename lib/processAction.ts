import { runAiAction, type AiAction } from "@/lib/aiActions";
import type { ParsedArticle } from "@/lib/parseArticle";
import {
  formatTranslatedArticle,
  translateArticle,
} from "@/lib/translateArticle";

export type ProcessAction = AiAction | "translate";

const VALID_ACTIONS: ProcessAction[] = [
  "summary",
  "theses",
  "telegram",
  "translate",
];

export function isProcessAction(value: string): value is ProcessAction {
  return VALID_ACTIONS.includes(value as ProcessAction);
}

export function getProcessActionError() {
  return "Укажите действие: summary, theses, telegram или translate";
}

export async function processArticle(
  action: ProcessAction,
  article: ParsedArticle,
  sourceUrl: string,
) {
  if (action === "translate") {
    const translated = await translateArticle(article);

    return {
      result: formatTranslatedArticle(translated),
    };
  }

  const result = await runAiAction(action, article, sourceUrl);

  return { result };
}
