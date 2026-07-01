import type { ParsedArticle } from "@/lib/parseArticle";

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}…`;
}

export function buildArticleText(article: ParsedArticle) {
  const parts = [
    article.title ? `Title: ${article.title}` : "",
    article.date ? `Date: ${article.date}` : "",
    article.content ? `Content:\n${truncate(article.content, 6000)}` : "",
  ].filter(Boolean);

  return parts.join("\n\n");
}
