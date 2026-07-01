import { NextResponse } from "next/server";

import {
  processArticleAction,
  type TextAction,
} from "@/lib/aiActions";
import { parseArticleFromUrl } from "@/lib/parseArticle";

const TEXT_ACTIONS: TextAction[] = ["summary", "theses", "telegram"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      action?: string;
    };
    const url = body.url?.trim();
    const action = body.action as TextAction;

    if (!url) {
      return NextResponse.json({ error: "URL обязателен" }, { status: 400 });
    }

    if (!TEXT_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
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
    const result = await processArticleAction(article, action);

    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось обработать статью";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
