const IMAGE_MODEL = "black-forest-labs/FLUX.1-schnell";

const HF_ENDPOINTS = [
  `https://router.huggingface.co/hf-inference/models/${IMAGE_MODEL}`,
  `https://api-inference.huggingface.co/models/${IMAGE_MODEL}`,
];

function getHuggingFaceApiKey() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY не задан в .env.local");
  }

  return apiKey;
}

async function requestImage(
  endpoint: string,
  apiKey: string,
  prompt: string,
): Promise<Response> {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { num_inference_steps: 5 },
    }),
  });
}

function formatHuggingFaceError(status: number, text: string) {
  if (status === 403 && text.includes("Inference Providers")) {
    return (
      "У токена Hugging Face нет права «Make calls to Inference Providers». " +
      "Создайте fine-grained токен с этим разрешением на https://huggingface.co/settings/tokens"
    );
  }

  return `Hugging Face: ${status} ${text}`;
}

export async function generateImage(prompt: string): Promise<Buffer> {
  const apiKey = getHuggingFaceApiKey();
  let lastError = "Hugging Face вернул ошибку";

  for (const endpoint of HF_ENDPOINTS) {
    const response = await requestImage(endpoint, apiKey, prompt);

    if (response.status === 503) {
      const text = await response.text();
      lastError = formatHuggingFaceError(response.status, text);
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      lastError = formatHuggingFaceError(response.status, text);
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const json = (await response.json()) as { error?: string };
      lastError = json.error ?? "Hugging Face вернул ошибку";
      continue;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error(lastError);
}
