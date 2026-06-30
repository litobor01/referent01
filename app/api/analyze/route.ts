import { NextResponse } from "next/server";

import { runAiAction, type AiAction } from "@/lib/aiActions";
import { parseArticleFromUrl } from "@/lib/parseArticle";

const VALID_ACTIONS: AiAction[] = ["summary", "theses", "telegram"];

function isAiAction(value: string): value is AiAction {
  return VALID_ACTIONS.includes(value as AiAction);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; action?: string };
    const url = body.url?.trim();
    const action = body.action?.trim();

    if (!url) {
      return NextResponse.json({ error: "URL обязателен" }, { status: 400 });
    }

    if (!action || !isAiAction(action)) {
      return NextResponse.json(
        { error: "Укажите действие: summary, theses или telegram" },
        { status: 400 },
      );
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

    if (!article.content?.trim()) {
      return NextResponse.json(
        { error: "Не найден текст статьи для анализа" },
        { status: 400 },
      );
    }

    const result = await runAiAction(action, article, parsedUrl.toString());

    return NextResponse.json({ action, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось выполнить анализ";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
