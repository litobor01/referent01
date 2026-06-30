import { NextResponse } from "next/server";

import { parseArticleFromUrl, type ParsedArticle } from "@/lib/parseArticle";
import { createErrorResponse, ERROR_CODES } from "@/lib/errors";
import {
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
      return NextResponse.json(
        { code: validation.code },
        { status: 400 },
      );
    }

    const action = body.action?.trim();

    if (!action || !isProcessAction(action)) {
      return NextResponse.json(
        { code: ERROR_CODES.ACTION_INVALID },
        { status: 400 },
      );
    }

    const sourceUrl = validation.url.toString();
    const article = body.article ?? (await parseArticleFromUrl(sourceUrl));

    if (!article.content?.trim()) {
      return NextResponse.json(
        { code: ERROR_CODES.ARTICLE_CONTENT_EMPTY },
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
    const { status, body } = createErrorResponse(error);

    return NextResponse.json(body, { status });
  }
}
