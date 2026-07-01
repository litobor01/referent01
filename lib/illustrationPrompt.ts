import { buildArticleText } from "@/lib/articleText";
import { createChatCompletion } from "@/lib/openrouter";
import type { ParsedArticle } from "@/lib/parseArticle";

export type IllustrationPromptResult = {
  imagePrompt: string;
  descriptionRu: string;
  titleRu: string;
};

function parseIllustrationResponse(raw: string): IllustrationPromptResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Не удалось разобрать ответ модели для иллюстрации");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    imagePrompt?: string;
    descriptionRu?: string;
    titleRu?: string;
  };

  if (!parsed.imagePrompt?.trim() || !parsed.descriptionRu?.trim()) {
    throw new Error("Модель вернула неполный ответ для иллюстрации");
  }

  return {
    imagePrompt: parsed.imagePrompt.trim(),
    descriptionRu: parsed.descriptionRu.trim(),
    titleRu: parsed.titleRu?.trim() || "Иллюстрация к статье",
  };
}

export async function createImagePromptFromArticle(
  article: ParsedArticle,
): Promise<IllustrationPromptResult> {
  const articleText = buildArticleText(article);

  const raw = await createChatCompletion(
    [
      {
        role: "system",
        content:
          'На основе англоязычной статьи подготовь данные для иллюстрации. Верни ТОЛЬКО JSON без markdown: {"imagePrompt":"яркое описание сцены на английском для text-to-image модели, без текста и логотипов на изображении","descriptionRu":"краткое описание иллюстрации на русском для пользователя","titleRu":"заголовок статьи на русском"}',
      },
      {
        role: "user",
        content: articleText || "Содержимое статьи недоступно.",
      },
    ],
    { maxTokens: 400 },
  );

  return parseIllustrationResponse(raw);
}
