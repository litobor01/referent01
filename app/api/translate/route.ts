import { NextResponse } from "next/server";

import { parseArticleFromUrl } from "@/lib/parseArticle";
import {
  formatTranslatedArticle,
  translateArticle,
} from "@/lib/translateArticle";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "URL обязателен" }, { status: 400 });
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Некорректный URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: "Поддерживаются только http:// и https://" },
        { status: 400 },
      );
    }

    const article = await parseArticleFromUrl(parsedUrl.toString());
    const translated = await translateArticle(article);

    return NextResponse.json({
      ...translated,
      formatted: formatTranslatedArticle(translated),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось перевести статью";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
