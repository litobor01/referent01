import { NextResponse } from "next/server";

import { parseArticleFromUrl } from "@/lib/parseArticle";
import { createErrorResponse } from "@/lib/errors";
import { validateArticleUrl } from "@/lib/validateUrl";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const validation = validateArticleUrl(body.url ?? "");

    if (!validation.ok) {
      return NextResponse.json(
        { code: validation.code },
        { status: 400 },
      );
    }

    const article = await parseArticleFromUrl(validation.url.toString());

    return NextResponse.json(article);
  } catch (error) {
    const { status, body } = createErrorResponse(error);

    return NextResponse.json(body, { status });
  }
}
