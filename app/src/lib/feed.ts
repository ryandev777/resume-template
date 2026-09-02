/**
 * Client-side aggregation of tech news + remote jobs from free, no-key public APIs. Both
 * dev.to and Remotive send `Access-Control-Allow-Origin: *`, so this fetches straight from
 * the browser — no backend/proxy needed. Fetched once per page load (no polling): Remotive's
 * own API docs ask for at most a handful of requests a day per client.
 */

export interface NewsCardData {
  id: string;
  kind: "news";
  title: string;
  url: string;
  source: string;
  author: string;
  summary: string;
  publishedAt: string;
  tags: string[];
}

export interface JobCardData {
  id: string;
  kind: "job";
  title: string;
  url: string;
  source: string;
  company: string;
  location: string;
  summary: string;
  publishedAt: string;
  tags: string[];
}

export type FeedCardData = NewsCardData | JobCardData;

const DEVTO_ARTICLES_URL = "https://dev.to/api/articles?per_page=12";
const REMOTIVE_JOBS_URL = "https://remotive.com/api/remote-jobs?category=software-dev&limit=12";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const safe = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${safe.trim()}…`;
}

interface DevToArticle {
  id: number;
  title: string;
  url: string;
  description: string | null;
  published_at: string;
  tag_list: string[];
  user?: { name?: string };
}

export async function fetchTechNews(): Promise<NewsCardData[]> {
  const res = await fetch(DEVTO_ARTICLES_URL);
  if (!res.ok) throw new Error(`dev.to respondeu ${res.status}`);
  const articles = (await res.json()) as DevToArticle[];
  return articles.map((a) => ({
    id: `devto-${a.id}`,
    kind: "news" as const,
    title: a.title,
    url: a.url,
    source: "dev.to",
    author: a.user?.name ?? "",
    summary: truncate(a.description ?? "", 220),
    publishedAt: a.published_at,
    tags: a.tag_list.slice(0, 4),
  }));
}

interface RemotiveJob {
  id: number;
  title: string;
  url: string;
  company_name: string;
  candidate_required_location: string;
  publication_date: string;
  description: string;
  tags: string[];
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

export async function fetchRemoteJobs(): Promise<JobCardData[]> {
  const res = await fetch(REMOTIVE_JOBS_URL);
  if (!res.ok) throw new Error(`Remotive respondeu ${res.status}`);
  const data = (await res.json()) as RemotiveResponse;
  return data.jobs.map((j) => ({
    id: `remotive-${j.id}`,
    kind: "job" as const,
    title: j.title,
    url: j.url,
    source: "Remotive",
    company: j.company_name,
    location: j.candidate_required_location || "",
    summary: truncate(stripHtml(j.description), 220),
    publishedAt: j.publication_date,
    tags: j.tags.slice(0, 4),
  }));
}

const RELATIVE_TIME_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

/** "3 hours ago" / "há 3 horas" — built on Intl.RelativeTimeFormat, no extra dependency. */
export function relativeTime(iso: string, locale: "pt-br" | "en"): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return "";

  let duration = (target - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale === "pt-br" ? "pt-BR" : "en-US", {
    numeric: "auto",
  });

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return "";
}
