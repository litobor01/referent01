import { NextResponse } from "next/server";

import { parseArticleFromUrl } from "@/lib/parseArticle";
import { validateArticleUrl } from "@/lib/validateUrl";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const validation = validateArticleUrl(body.url ?? "");

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const article = await parseArticleFromUrl(validation.url.toString());

    return NextResponse.json(article);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось распарсить статью";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
