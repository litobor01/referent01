"use client";

import { FormEvent, useState } from "react";

type Action = "summary" | "theses" | "telegram";

const ACTION_LABELS: Record<Action, string> = {
  summary: "О чем статья?",
  theses: "Тезисы",
  telegram: "Пост для Telegram",
};

const PLACEHOLDER_RESULTS: Record<Action, string> = {
  summary:
    "Здесь появится краткое описание статьи: основная тема, ключевые идеи и выводы автора.",
  theses:
    "Здесь появятся тезисы статьи — структурированный список главных утверждений и аргументов.",
  telegram:
    "Здесь появится готовый пост для Telegram: цепляющий заголовок, суть материала и ссылка на источник.",
};

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ArticleAnalyzer() {
  const [url, setUrl] = useState("");
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const urlIsValid = isValidUrl(url.trim());

  async function handleAction(action: Action) {
    const trimmedUrl = url.trim();

    if (!isValidUrl(trimmedUrl)) {
      setError("Введите корректный URL статьи (http:// или https://).");
      return;
    }

    setError("");
    setActiveAction(action);
    setIsLoading(true);
    setResult("");

    await new Promise((resolve) => setTimeout(resolve, 900));

    setResult(PLACEHOLDER_RESULTS[action]);
    setIsLoading(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleAction("summary");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-sky-600 uppercase">
          referent01
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Анализ англоязычных статей
        </h1>
        <p className="text-slate-600">
          Вставьте ссылку на статью, выберите действие — результат появится ниже.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">
            URL англоязычной статьи
          </span>
          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/article"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {(Object.keys(ACTION_LABELS) as Action[]).map((action) => (
            <button
              key={action}
              type="button"
              disabled={!urlIsValid || isLoading}
              onClick={() => void handleAction(action)}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-slate-900">Результат</h2>
          {activeAction ? (
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              {ACTION_LABELS[activeAction]}
            </span>
          ) : null}
        </div>

        <div className="min-h-40 rounded-xl bg-slate-50 p-4 text-slate-700">
          {isLoading ? (
            <p className="animate-pulse text-slate-500">Генерация ответа...</p>
          ) : result ? (
            <p className="whitespace-pre-wrap leading-7">{result}</p>
          ) : (
            <p className="text-slate-500">
              Результат появится здесь после выбора действия.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
