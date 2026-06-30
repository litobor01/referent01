import { AppError, ERROR_CODES } from "@/lib/errors";

export type ChatMessage = {
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

export async function chatCompletionStream(messages: ChatMessage[]) {
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
        stream: true,
      }),
    });
  } catch {
    throw new AppError(ERROR_CODES.AI_FAILED);
  }

  if (!response.ok || !response.body) {
    throw new AppError(ERROR_CODES.AI_FAILED);
  }

  return response.body;
}

export async function* readOpenRouterDeltaStream(
  body: ReadableStream<Uint8Array>,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed.startsWith("data: ")) {
          continue;
        }

        const payload = trimmed.slice(6);

        if (payload === "[DONE]") {
          return;
        }

        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const content = parsed.choices?.[0]?.delta?.content;

          if (content) {
            yield content;
          }
        } catch {
          continue;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function createTextDeltaStream(
  upstream: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of readOpenRouterDeltaStream(upstream)) {
          controller.enqueue(encoder.encode(chunk));
        }

        controller.close();
      } catch {
        controller.error(new AppError(ERROR_CODES.AI_FAILED));
      }
    },
  });
}
