import { NextResponse } from "next/server";

import { generateImage } from "@/lib/huggingface";
import { createImagePromptFromArticle } from "@/lib/illustrationPrompt";
import { parseArticleFromUrl } from "@/lib/parseArticle";

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
    const prompt = await createImagePromptFromArticle(article);
    const imageBuffer = await generateImage(prompt);
    const mimeType =
      imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8
        ? "image/jpeg"
        : "image/png";

    return NextResponse.json({
      prompt,
      image: `data:${mimeType};base64,${imageBuffer.toString("base64")}`,
      title: article.title,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось сгенерировать иллюстрацию";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
