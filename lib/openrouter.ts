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
    throw new Error("OPENAI_API_KEY не задан в .env.local");
  }

  return { apiKey, baseUrl };
}

export async function chatCompletion(messages: ChatMessage[]) {
  const { apiKey, baseUrl } = getOpenRouterConfig();

  const response = await fetch(`${baseUrl}/chat/completions`, {
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Ошибка OpenRouter: HTTP ${response.status}${errorText ? ` — ${errorText}` : ""}`,
    );
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
