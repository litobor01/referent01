import { buildArticleText } from "@/lib/articleText";
import { createChatCompletion } from "@/lib/openrouter";
import type { ParsedArticle } from "@/lib/parseArticle";

export type TextAction = "summary" | "theses" | "telegram";

const SYSTEM_PROMPTS: Record<TextAction, string> = {
  summary:
    "Ты помощник-аналитик. На основе англоязычной статьи напиши краткий ответ на русском языке: о чём эта статья. 2–4 предложения. Отвечай только по существу, без вводных фраз вроде «В статье говорится».",
  theses:
    "Ты помощник-аналитик. На основе англоязычной статьи составь тезисы на русском языке: 5–8 пунктов, каждый — одно ёмкое предложение. Используй маркированный список.",
  telegram:
    "Ты редактор Telegram-канала. На основе англоязычной статьи напиши пост для Telegram на русском языке: цепляющий заголовок, 2–4 абзаца, в конце 2–3 хештега.",
};

const MAX_TOKENS: Record<TextAction, number> = {
  summary: 400,
  theses: 700,
  telegram: 900,
};

export async function processArticleAction(
  article: ParsedArticle,
  action: TextAction,
): Promise<string> {
  const articleText = buildArticleText(article);

  return createChatCompletion(
    [
      { role: "system", content: SYSTEM_PROMPTS[action] },
      {
        role: "user",
        content: articleText || "Содержимое статьи недоступно.",
      },
    ],
    { maxTokens: MAX_TOKENS[action] },
  );
}
