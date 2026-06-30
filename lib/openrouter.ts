import { AppError, ERROR_CODES } from "@/lib/errors";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const DEEPSEEK_MODEL = "deepseek/deepseek-chat";

function getOpenRouterConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl =
    process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ??
    "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new AppError(ERROR_CODES.AI_CONFIG_ERROR);
  }

  return { apiKey, baseUrl };
}

export async function chatCompletion(messages: ChatMessage[]) {
  const { apiKey, baseUrl } = getOpenRouterConfig();

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(120000),
    });
  } catch {
    throw new AppError(ERROR_CODES.AI_FAILED);
  }

  if (!response.ok) {
    throw new AppError(ERROR_CODES.AI_FAILED);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError(ERROR_CODES.AI_FAILED);
  }

  return content;
}
