"use client";

import { AlertCircle } from "lucide-react";
import { FormEvent, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ERROR_CODES,
  getErrorMessage,
  type ErrorCode,
} from "@/lib/errors";
import type { ParsedArticle } from "@/lib/parseArticle";
import { isValidArticleUrl } from "@/lib/validateUrl";

type Action = "summary" | "theses" | "telegram";

type ApiErrorResponse = {
  code?: ErrorCode;
};

const ACTION_LABELS: Record<Action, string> = {
  summary: "О чем статья?",
  theses: "Тезисы",
  telegram: "Пост для Telegram",
};

const ACTION_TITLES: Record<Action, string> = {
  summary: "Кратко рассказать, о чём статья и какой у неё вывод",
  theses: "Выделить ключевые тезисы статьи списком",
  telegram: "Подготовить короткий пост для публикации в Telegram",
};

const ACTION_STYLES: Record<Action, string> = {
  summary:
    "bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 focus-visible:ring-sky-300",
  theses:
    "bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 focus-visible:ring-violet-300",
  telegram:
    "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 focus-visible:ring-emerald-300",
};

const ACTION_BADGE_STYLES: Record<Action, string> = {
  summary: "bg-sky-50 text-sky-700",
  theses: "bg-violet-50 text-violet-700",
  telegram: "bg-emerald-50 text-emerald-700",
};

const PROCESS_LABELS: Record<Action, string> = {
  summary: "Анализирую статью…",
  theses: "Формирую тезисы…",
  telegram: "Готовлю пост для Telegram…",
};

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    return data.code ?? ERROR_CODES.UNKNOWN;
  } catch {
    return ERROR_CODES.UNKNOWN;
  }
}

export default function ArticleAnalyzer() {
  const [url, setUrl] = useState("");
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processStatus, setProcessStatus] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [parsedCache, setParsedCache] = useState<{
    url: string;
    article: ParsedArticle;
  } | null>(null);

  const urlIsFilled = url.trim().length > 0;

  function handleUrlChange(value: string) {
    setUrl(value);
    setErrorCode(null);

    if (value.trim() !== parsedCache?.url) {
      setParsedCache(null);
    }
  }

  async function handleAction(action: Action) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setErrorCode(ERROR_CODES.URL_REQUIRED);
      return;
    }

    if (!isValidArticleUrl(trimmedUrl)) {
      setErrorCode(ERROR_CODES.URL_INVALID);
      return;
    }

    setErrorCode(null);
    setActiveAction(action);
    setIsLoading(true);
    setResult("");

    const cachedArticle =
      parsedCache?.url === trimmedUrl ? parsedCache.article : undefined;

    setProcessStatus(
      cachedArticle ? PROCESS_LABELS[action] : "Загружаю статью…",
    );

    let article = cachedArticle;

    try {
      if (!article) {
        let parseResponse: Response;

        try {
          parseResponse = await fetch("/api/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: trimmedUrl }),
          });
        } catch {
          setErrorCode(ERROR_CODES.NETWORK_ERROR);
          return;
        }

        if (!parseResponse.ok) {
          setErrorCode(await readApiError(parseResponse));
          return;
        }

        article = (await parseResponse.json()) as ParsedArticle;
        setParsedCache({ url: trimmedUrl, article });
      }

      setProcessStatus(PROCESS_LABELS[action]);

      let response: Response;

      try {
        response = await fetch("/api/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: trimmedUrl,
            action,
            article,
          }),
        });
      } catch {
        setErrorCode(ERROR_CODES.NETWORK_ERROR);
        return;
      }

      if (!response.ok) {
        setErrorCode(await readApiError(response));
        return;
      }

      const data = (await response.json()) as {
        result?: string;
        article?: ParsedArticle;
      };

      if (data.article) {
        setParsedCache({ url: trimmedUrl, article: data.article });
      }

      setResult(data.result ?? "");
    } finally {
      setIsLoading(false);
      setProcessStatus(null);
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
            onChange={(event) => handleUrlChange(event.target.value)}
            placeholder="Введите URL статьи, например: https://example.com/article"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          />
          <span className="block text-xs text-slate-500">
            Укажите ссылку на англоязычную статью
          </span>
        </label>

        {errorCode ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Не получилось выполнить действие</AlertTitle>
            <AlertDescription>{getErrorMessage(errorCode)}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {(Object.keys(ACTION_LABELS) as Action[]).map((action) => (
            <button
              key={action}
              type="button"
              title={ACTION_TITLES[action]}
              disabled={!urlIsFilled || isLoading}
              onClick={() => void handleAction(action)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed ${ACTION_STYLES[action]}`}
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      </form>

      {isLoading && processStatus ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <p className="animate-pulse">{processStatus}</p>
        </div>
      ) : null}

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
          {result ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {result}
            </p>
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
