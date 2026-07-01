type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function getOpenRouterConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl =
    process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ??
    "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY не задан в .env.local");
  }

  return { apiKey, baseUrl };
}

export async function createChatCompletion(
  messages: ChatMessage[],
  options?: { model?: string; maxTokens?: number },
): Promise<string> {
  const { apiKey, baseUrl } = getOpenRouterConfig();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:
        options?.model ??
        process.env.OPENROUTER_MODEL ??
        "openai/gpt-4o-mini",
      messages,
      max_tokens: options?.maxTokens ?? 300,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenRouter вернул пустой ответ");
  }

  return content;
}
