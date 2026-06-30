import type { ParsedArticle } from "@/lib/parseArticle";
import { chatCompletion } from "@/lib/openrouter";

const MAX_CONTENT_LENGTH = 12000;

export type TranslatedArticle = {
  date: string | null;
  title: string | null;
  content: string | null;
};

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const source = fenced?.[1]?.trim() ?? text.trim();
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Не удалось разобрать ответ перевода");
  }

  return JSON.parse(source.slice(start, end + 1)) as {
    title?: string;
    content?: string;
  };
}

export async function translateArticle(
  article: ParsedArticle,
): Promise<TranslatedArticle> {
  if (!article.title && !article.content) {
    throw new Error("Не найдены заголовок и текст статьи для перевода");
  }

  const title = article.title ?? "";
  const content = (article.content ?? "").slice(0, MAX_CONTENT_LENGTH);

  const response = await chatCompletion([
    {
      role: "system",
      content:
        "Ты профессиональный переводчик. Переводи с английского на русский. Отвечай только валидным JSON без markdown.",
    },
    {
      role: "user",
      content: `Переведи заголовок и текст статьи на русский язык. Сохрани смысл и абзацы.

Верни JSON:
{"title":"перевод заголовка","content":"перевод текста"}

Заголовок:
${title}

Текст:
${content}`,
    },
  ]);

  const parsed = extractJsonObject(response);

  return {
    date: article.date,
    title: parsed.title?.trim() || null,
    content: parsed.content?.trim() || null,
  };
}

export function formatTranslatedArticle(article: TranslatedArticle) {
  const parts = [
    article.date ? `Дата: ${article.date}` : null,
    article.title ? `Заголовок:\n${article.title}` : null,
    article.content ? `Текст:\n${article.content}` : null,
  ].filter(Boolean);

  return parts.join("\n\n");
}
