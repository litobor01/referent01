import type { ParsedArticle } from "@/lib/parseArticle";
import { chatCompletion } from "@/lib/openrouter";

export type AiAction = "summary" | "theses" | "telegram";

const MAX_CONTENT_LENGTH = 12000;

const SYSTEM_PROMPTS: Record<AiAction, string> = {
  summary:
    "Ты редактор и аналитик. Кратко объясняешь содержание англоязычных статей на русском языке. Пиши ясно, без воды и без пересказа каждого абзаца.",
  theses:
    "Ты редактор. Выделяешь ключевые тезисы из англоязычных статей и формулируешь их на русском языке. Каждый тезис — одна законченная мысль.",
  telegram:
    "Ты SMM-редактор. Пишешь короткие посты для Telegram на русском языке по материалам англоязычных статей. Текст должен быть живым и понятным широкой аудитории.",
};

function buildUserPrompt(
  action: AiAction,
  article: ParsedArticle,
  sourceUrl: string,
) {
  const title = article.title ?? "Без заголовка";
  const date = article.date ? `Дата публикации: ${article.date}\n` : "";
  const content = (article.content ?? "").slice(0, MAX_CONTENT_LENGTH);

  const articleBlock = `${date}Заголовок: ${title}

Текст статьи:
${content}`;

  switch (action) {
    case "summary":
      return `Прочитай статью и ответь на русском языке в 3–5 предложениях:
- о чём статья;
- какая основная мысль;
- к какому выводу приходит автор.

${articleBlock}`;

    case "theses":
      return `Прочитай статью и составь на русском языке маркированный список из 5–10 ключевых тезисов.
Каждый пункт начинай с «- ». Не дублируй заголовок и не добавляй вступление.

${articleBlock}`;

    case "telegram":
      return `Подготовь пост для Telegram на русском языке по этой статье.
Требования:
- цепляющий заголовок в первой строке;
- 1–2 коротких абзаца с сутью материала;
- в конце обязательно укажи ссылку на источник: ${sourceUrl};
- общий объём до 1500 символов;
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
