import type { ParsedArticle } from "@/lib/parseArticle";
import { chatCompletion } from "@/lib/openrouter";

export type AiAction = "summary" | "theses" | "telegram";

const MAX_CONTENT_LENGTH = 12000;

const SYSTEM_PROMPTS: Record<AiAction, string> = {
  summary: `Ты опытный редактор-аналитик. Твоя задача — кратко объяснить суть англоязычной статьи на русском языке.
Правила:
- пиши связным текстом из 3–5 предложений;
- не пересказывай статью по абзацам и не цитируй её дословно;
- не используй списки, заголовки и вступления вроде «В этой статье…»;
- выдели тему, главную мысль и итоговый вывод автора.`,

  theses: `Ты опытный редактор. Твоя задача — выделить ключевые тезисы англоязычной статьи и сформулировать их на русском языке.
Правила:
- каждый тезис — одна законченная мысль в 1–2 предложениях;
- не дублируй заголовок статьи;
- не добавляй вступление и заключение;
- отвечай только списком тезисов.`,

  telegram: `Ты SMM-редактор Telegram-каналов. Твоя задача — написать короткий пост на русском языке по англоязычной статье.
Правила:
- текст должен быть живым, понятным и интересным широкой аудитории;
- можно использовать 1–2 уместных эмодзи, но не перегружай ими текст;
- не используй хэштеги;
- общий объём поста — не более 1500 символов;
- в конце обязательно оставь ссылку на источник отдельной строкой.`,
};

function buildArticleBlock(article: ParsedArticle) {
  const title = article.title ?? "Без заголовка";
  const date = article.date ? `Дата публикации: ${article.date}\n` : "";
  const content = (article.content ?? "").slice(0, MAX_CONTENT_LENGTH);

  return `${date}Заголовок: ${title}

Текст статьи:
${content}`;
}

function buildUserPrompt(
  action: AiAction,
  article: ParsedArticle,
  sourceUrl: string,
) {
  const articleBlock = buildArticleBlock(article);

  switch (action) {
    case "summary":
      return `Прочитай статью и напиши краткий ответ на русском языке.

Формат ответа: 3–5 предложений обычным текстом, без списков.

Ответ должен отвечать на вопросы:
1. О чём статья?
2. Какая основная мысль?
3. К какому выводу приходит автор?

${articleBlock}`;

    case "theses":
      return `Прочитай статью и составь 5–10 ключевых тезисов на русском языке.

Формат ответа: нумерованный список.
Каждый пункт начинай с номера и точки, например: «1. …»

Требования:
- один тезис = одна мысль;
- без вступления и итоговой фразы;
- без повторения заголовка.

${articleBlock}`;

    case "telegram":
      return `Подготовь пост для Telegram на русском языке по этой статье.

Формат ответа:
1. Первая строка — цепляющий заголовок.
2. Пустая строка.
3. 1–2 коротких абзаца с сутью материала.
4. Пустая строка.
5. Ссылка на источник: ${sourceUrl}

Требования:
- до 1500 символов;
- 1–2 уместных эмодзи допускаются;
- без хэштегов.

${articleBlock}`;

    default:
      return articleBlock;
  }
}

export async function runAiAction(
  action: AiAction,
  article: ParsedArticle,
  sourceUrl: string,
) {
  if (!article.content?.trim()) {
    throw new Error("Не найден текст статьи для анализа");
  }

  return chatCompletion([
    { role: "system", content: SYSTEM_PROMPTS[action] },
    { role: "user", content: buildUserPrompt(action, article, sourceUrl) },
  ]);
}
