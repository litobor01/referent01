import * as cheerio from "cheerio";

export type ParsedArticle = {
  date: string | null;
  title: string | null;
  content: string | null;
};

const TITLE_SELECTORS = [
  'meta[property="og:title"]',
  'meta[name="twitter:title"]',
  "article h1",
  "main h1",
  "h1",
  "title",
];

const DATE_META_SELECTORS = [
  'meta[property="article:published_time"]',
  'meta[name="article:published_time"]',
  'meta[property="og:article:published_time"]',
  'meta[name="pubdate"]',
  'meta[name="date"]',
  'meta[itemprop="datePublished"]',
  'meta[property="og:updated_time"]',
];

const DATE_ELEMENT_SELECTORS = [
  "time[datetime]",
  ".date",
  ".published",
  ".post-date",
  ".entry-date",
  '[class*="publish"]',
];

const CONTENT_SELECTORS = [
  "article",
  '[role="article"]',
  ".post-content",
  ".entry-content",
  ".article-content",
  ".article-body",
  ".post-body",
  ".post",
  ".content",
  "main",
];

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function getMetaContent($: cheerio.CheerioAPI, selector: string) {
  const value = $(selector).first().attr("content")?.trim();
  return value || null;
}

function extractTitle($: cheerio.CheerioAPI) {
  for (const selector of TITLE_SELECTORS) {
    if (selector.startsWith("meta")) {
      const value = getMetaContent($, selector);
      if (value) {
        return value;
      }
      continue;
    }

    const value = normalizeText($(selector).first().text());
    if (value) {
      return value;
    }
  }

  return null;
}

function extractDate($: cheerio.CheerioAPI) {
  for (const selector of DATE_META_SELECTORS) {
    const value = getMetaContent($, selector);
    if (value) {
      return value;
    }
  }

  for (const selector of DATE_ELEMENT_SELECTORS) {
    const element = $(selector).first();

    if (!element.length) {
      continue;
    }

    const datetime = element.attr("datetime")?.trim();
    if (datetime) {
      return datetime;
    }

    const text = normalizeText(element.text());
    if (text) {
      return text;
    }
  }

  return null;
}

function extractContent($: cheerio.CheerioAPI) {
  for (const selector of CONTENT_SELECTORS) {
    const element = $(selector).first();

    if (!element.length) {
      continue;
    }

    const clone = element.clone();
    clone
      .find(
        "script, style, nav, header, footer, aside, .comments, #comments, .sidebar, .advertisement, .ad",
      )
      .remove();

    const text = normalizeText(clone.text());
    if (text.length >= 100) {
      return text;
    }
  }

  const body = $("body").clone();
  body
    .find("script, style, nav, header, footer, aside, .comments, #comments")
    .remove();

  const fallback = normalizeText(body.text());
  return fallback || null;
}

export function parseArticleFromHtml(html: string): ParsedArticle {
  const $ = cheerio.load(html);

  return {
    date: extractDate($),
    title: extractTitle($),
    content: extractContent($),
  };
}

export async function fetchArticleHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; referent01/1.0; +https://localhost)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить страницу: HTTP ${response.status}`);
  }

  return response.text();
}

export async function parseArticleFromUrl(url: string): Promise<ParsedArticle> {
  const html = await fetchArticleHtml(url);
  return parseArticleFromHtml(html);
}
