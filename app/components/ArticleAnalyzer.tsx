"use client";

import { AlertCircle } from "lucide-react";
import { FormEvent, useRef, useState } from "react";

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

const BUTTON_BASE_CLASS =
  "w-full rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed md:w-auto md:py-2.5";

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

const COPY_IN_PROGRESS_HINT =
  "Генерация ещё не завершена. Подождите немного.";

async function readTextStream(
  response: Response,
  onUpdate: (text: string) => void,
) {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error(ERROR_CODES.AI_FAILED);
  }

  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    result += decoder.decode(value, { stream: true });
    onUpdate(result);
  }

  result += decoder.decode();
  onUpdate(result);

  return result;
}

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    return data.code ?? ERROR_CODES.UNKNOWN;
  } catch {
    return ERROR_CODES.UNKNOWN;
  }
}

export default function ArticleAnalyzer() {
  const resultSectionRef = useRef<HTMLElement>(null);
  const [url, setUrl] = useState("");
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
  const [processStatus, setProcessStatus] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [copyLabel, setCopyLabel] = useState("Копировать");
  const [parsedCache, setParsedCache] = useState<{
    url: string;
    article: ParsedArticle;
  } | null>(null);

  const urlIsFilled = url.trim().length > 0;

  function handleClear() {
    setUrl("");
    setActiveAction(null);
    setResult("");
    setIsLoading(false);
    setIsStreaming(false);
    setIsGenerationComplete(false);
    setProcessStatus(null);
    setErrorCode(null);
    setCopyLabel("Копировать");
    setIsStreaming(false);
    setIsGenerationComplete(false);
    setParsedCache(null);
  }

  async function handleCopy() {
    if (!result) {
      return;
    }

    if (!isGenerationComplete) {
      setCopyLabel(COPY_IN_PROGRESS_HINT);
      window.setTimeout(() => setCopyLabel("Копировать"), 2500);
      return;
    }

    try {
      await navigator.clipboard.writeText(result);
      setCopyLabel("Скопировано");
      window.setTimeout(() => setCopyLabel("Копировать"), 2000);
    } catch {
      setErrorCode(ERROR_CODES.UNKNOWN);
    }
  }

  function scrollToResult() {
    window.requestAnimationFrame(() => {
      resultSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

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
    setIsStreaming(false);
    setIsGenerationComplete(false);
    setResult("");
    setCopyLabel("Копировать");

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

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        if (contentType.includes("application/json")) {
          setErrorCode(await readApiError(response));
        } else {
          setErrorCode(ERROR_CODES.AI_FAILED);
        }
        return;
      }

      setProcessStatus(null);
      setIsStreaming(true);
      scrollToResult();

      const streamedResult = await readTextStream(response, setResult);

      if (!streamedResult.trim()) {
        setErrorCode(ERROR_CODES.AI_FAILED);
        setResult("");
        return;
      }

      setIsGenerationComplete(true);
    } catch {
      setErrorCode(ERROR_CODES.AI_FAILED);
      setResult("");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setProcessStatus(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleAction("summary");
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 md:gap-8">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-sky-600 uppercase sm:text-sm">
          referent01
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Анализ англоязычных статей
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
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
            className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 sm:text-sm"
          />
          <span className="block text-xs text-slate-500">
            Укажите ссылку на англоязычную статью
          </span>
        </label>

        {errorCode ? (
          <Alert variant="destructive" className="break-words">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Не получилось выполнить действие</AlertTitle>
            <AlertDescription>{getErrorMessage(errorCode)}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          {(Object.keys(ACTION_LABELS) as Action[]).map((action) => (
            <button
              key={action}
              type="button"
              title={ACTION_TITLES[action]}
              disabled={!urlIsFilled || isLoading}
              onClick={() => void handleAction(action)}
              className={`${BUTTON_BASE_CLASS} text-white ${ACTION_STYLES[action]}`}
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleClear}
            className={`${BUTTON_BASE_CLASS} border border-red-300 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300 disabled:bg-red-300`}
          >
            Очистить
          </button>
        </div>
      </form>

      {isLoading && processStatus ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm break-words text-sky-800">
          <p className="animate-pulse">{processStatus}</p>
        </div>
      ) : null}

      <section
        ref={resultSectionRef}
        className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-slate-900">Результат</h2>
          <div className="flex flex-wrap items-center gap-2">
            {activeAction ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${ACTION_BADGE_STYLES[activeAction]}`}
              >
                {ACTION_LABELS[activeAction]}
              </span>
            ) : null}
            {result || isStreaming ? (
              <button
                type="button"
                title={
                  isGenerationComplete
                    ? "Скопировать результат"
                    : COPY_IN_PROGRESS_HINT
                }
                onClick={() => void handleCopy()}
                className={`rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none ${
                  isGenerationComplete
                    ? "text-slate-700 hover:bg-slate-50"
                    : "cursor-not-allowed text-slate-500 opacity-70"
                }`}
              >
                {copyLabel}
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-40 rounded-xl bg-slate-50 p-4 text-slate-700">
          {result || isStreaming ? (
            <p className="text-sm leading-7 break-words whitespace-pre-wrap text-slate-700 [overflow-wrap:anywhere]">
              {result}
              {isStreaming ? (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-sky-500 align-middle" />
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-slate-500 sm:text-base">
              Результат появится здесь после выбора действия.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
