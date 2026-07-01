import { createChatCompletion } from "@/lib/openrouter";
import type { ParsedArticle } from "@/lib/parseArticle";

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}…`;
}

function buildArticleText(article: ParsedArticle) {
  const parts = [
    article.title ? `Title: ${article.title}` : "",
    article.date ? `Date: ${article.date}` : "",
    article.content ? `Content:\n${truncate(article.content, 6000)}` : "",
  ].filter(Boolean);

  return parts.join("\n\n");
}

export async function createImagePromptFromArticle(
  article: ParsedArticle,
): Promise<string> {
  const articleText = buildArticleText(article);

  return createChatCompletion([
    {
      role: "system",
      content:
        "You create prompts for text-to-image AI models. Based on an English article, write ONE vivid scene description in English that visually represents the article's main theme. The prompt should be concrete, visual, and suitable for illustration. Do not include text, logos, or watermarks in the image. Reply with ONLY the prompt, without quotes or explanation.",
    },
    {
      role: "user",
      content: articleText || "No article content available.",
    },
  ]);
}
