import { NextResponse } from "next/server";

import { parseArticleFromUrl, type ParsedArticle } from "@/lib/parseArticle";
import {
  getProcessActionError,
  isProcessAction,
  processArticle,
} from "@/lib/processAction";
import { validateArticleUrl } from "@/lib/validateUrl";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string;
      action?: string;
      article?: ParsedArticle;
    };

    const validation = validateArticleUrl(body.url ?? "");

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const action = body.action?.trim();

    if (!action || !isProcessAction(action)) {
      return NextResponse.json(
        { error: getProcessActionError() },
        { status: 400 },
      );
    }

    const sourceUrl = validation.url.toString();
    const article = body.article ?? (await parseArticleFromUrl(sourceUrl));

    if (!article.content?.trim()) {
      return NextResponse.json(
        { error: "Не найден текст статьи для обработки" },
        { status: 400 },
      );
    }

    const { result } = await processArticle(action, article, sourceUrl);

    return NextResponse.json({
      action,
      result,
      article,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обработать статью";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
