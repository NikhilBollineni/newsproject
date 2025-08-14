import type { Article } from "@shared/schema";

function escape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = Array.isArray(value)
    ? value.join("|")
    : value instanceof Date
      ? value.toISOString()
      : String(value);
  if (str.includes('"')) str = str.replace(/"/g, '""');
  if (/[",\n]/.test(str)) str = `"${str}"`;
  return str;
}

export function articlesToCSV(articles: Article[]): string {
  const headers = [
    "id",
    "title",
    "content",
    "summary",
    "source",
    "category",
    "industry",
    "sentiment",
    "sentimentScore",
    "views",
    "isBookmarked",
    "tags",
    "publishedAt",
    "createdAt"
  ];

  const rows = articles.map(a => [
    escape(a.id),
    escape(a.title),
    escape(a.content),
    escape(a.summary),
    escape(a.source),
    escape(a.category),
    escape(a.industry),
    escape(a.sentiment),
    escape(a.sentimentScore),
    escape(a.views),
    escape(a.isBookmarked),
    escape(a.tags),
    escape(a.publishedAt),
    escape(a.createdAt)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
