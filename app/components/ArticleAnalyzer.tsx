"use client";

import { FormEvent, useState } from "react";

type Action = "summary" | "theses" | "telegram" | "illustration";

const ACTION_LABELS: Record<Action, string> = {
  summary: "О чем статья?",
  theses: "Тезисы",
  telegram: "Пост для Telegram",
  illustration: "Иллюстрация",
};

const ACTION_STYLES: Record<Action, string> = {
  summary:
    "bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 focus-visible:ring-sky-300",
  theses:
    "bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 focus-visible:ring-violet-300",
  telegram:
    "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 focus-visible:ring-emerald-300",
  illustration:
    "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 focus-visible:ring-amber-300",
};

const ACTION_BADGE_STYLES: Record<Action, string> = {
  summary: "bg-sky-50 text-sky-700",
  theses: "bg-violet-50 text-violet-700",
  telegram: "bg-emerald-50 text-emerald-700",
  illustration: "bg-amber-50 text-amber-700",
};

const LOADING_LABELS: Record<Action, string> = {
  summary: "Парсинг статьи...",
  theses: "Парсинг статьи...",
  telegram: "Парсинг статьи...",
  illustration: "Генерация иллюстрации...",
};

type IllustrationResult = {
  prompt: string;
  image: string;
  title: string | null;
};

type ParsedArticle = {
  date: string | null;
  title: string | null;
  content: string | null;
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
  const [illustration, setIllustration] = useState<IllustrationResult | null>(
    null,
  );
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
    setIllustration(null);

    try {
      if (action === "illustration") {
        const response = await fetch("/api/illustration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmedUrl }),
        });

        const data = (await response.json()) as IllustrationResult & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Не удалось сгенерировать иллюстрацию");
        }

        setIllustration({
          prompt: data.prompt,
          image: data.image,
          title: data.title,
        });
        return;
      }

      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = (await response.json()) as ParsedArticle & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось распарсить статью");
      }

      const article: ParsedArticle = {
        date: data.date,
        title: data.title,
        content: data.content,
      };

      setResult(JSON.stringify(article, null, 2));
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : action === "illustration"
            ? "Не удалось сгенерировать иллюстрацию"
            : "Не удалось распарсить статью",
      );
      setResult("");
      setIllustration(null);
    } finally {
      setIsLoading(false);
    }
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
              className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed ${ACTION_STYLES[action]}`}
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
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${ACTION_BADGE_STYLES[activeAction]}`}
            >
              {ACTION_LABELS[activeAction]}
            </span>
          ) : null}
        </div>

        <div className="min-h-40 rounded-xl bg-slate-50 p-4 text-slate-700">
          {isLoading ? (
            <p className="animate-pulse text-slate-500">
              {activeAction ? LOADING_LABELS[activeAction] : "Загрузка..."}
            </p>
          ) : illustration && activeAction === "illustration" ? (
            <div className="space-y-4">
              {illustration.title ? (
                <p className="text-sm font-medium text-slate-900">
                  {illustration.title}
                </p>
              ) : null}
              <img
                src={illustration.image}
                alt={illustration.prompt}
                className="max-h-[480px] w-full rounded-lg object-contain"
              />
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Промпт для изображения
                </p>
                <p className="text-sm leading-6 text-slate-700">
                  {illustration.prompt}
                </p>
              </div>
            </div>
          ) : result ? (
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-6">
              {result}
            </pre>
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
