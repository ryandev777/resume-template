/**
 * Client-side aggregation of tech news + remote jobs from free, no-key public APIs — every
 * source here sends `Access-Control-Allow-Origin: *`, so this fetches straight from the
 * browser, no backend/proxy needed. Fetched once per page load (no polling): several of these
 * APIs' own docs ask for at most a handful of requests a day per client.
 *
 * Sources, by region bucket (see fetchTechNews/fetchRemoteJobs for "Internacional",
 * fetchBrazilNews/fetchBrazilJobs for "Brasil"): dev.to + Hacker News (news), Remotive + Jobicy
 * (international jobs), TabNews (Brazilian news), frontendbr/vagas + backend-br/vagas +
 * react-brasil/vagas + job-finder (Brazilian jobs, the last one specifically for entry-level
 * roles). Each fetcher below documents what was validated about it and, for the Brazilian job
 * boards, which other candidates were checked and rejected.
 *
 * RemoteOK was tried and dropped: its API is technically fine (CORS, shape all check out), but
 * its `tags` query param is a no-op (confirmed by requesting it and getting the same unfiltered
 * list back) and the actual job mix at validation time was dominated by non-tech listings (car
 * detailers, kitchen staff, janitors...) sharing recycled/noisy tags that made client-side
 * filtering unreliable — even a "position title OR 2+ matching tags" filter let clearly
 * irrelevant jobs through. Not worth the noise in a dev-focused feed.
 */

import { matchKeywords } from "./keywords";
import type { Locale, ResumeData } from "./types";

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

export type EntryLevel = "estagio" | "trainee" | "junior";

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
  /** Full, untruncated tag list from the source — kept only for match scoring (see
   * computeJobMatchPct), separate from `tags` above which is capped for card display. */
  allTags: string[];
  /** Detected from the title (see detectEntryLevel) — surfaced as a badge on the card. */
  entryLevel: EntryLevel | null;
}

const ENTRY_LEVEL_PATTERNS: { level: EntryLevel; re: RegExp }[] = [
  { level: "estagio", re: /est[aá]gi[oa]|\bintern(?:ship)?\b/i },
  { level: "trainee", re: /\btrainee\b/i },
  { level: "junior", re: /j[uú]nior|\bjr\.?\b/i },
];

/** Entry-level signal parsed straight from the job title — no new filter yet, just a badge so
 * these are easy to spot while scanning a mixed feed (per Fase H: internship/trainee/junior). */
export function detectEntryLevel(title: string): EntryLevel | null {
  for (const { level, re } of ENTRY_LEVEL_PATTERNS) {
    if (re.test(title)) return level;
  }
  return null;
}

export type FeedCardData = NewsCardData | JobCardData;

const DEVTO_ARTICLES_URL = "https://dev.to/api/articles?per_page=30";
const REMOTIVE_JOBS_URL = "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";

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

/** Runs several fetchers for the same feed bucket (e.g. all the "Internacional" job sources)
 * and flattens whatever succeeds — one source failing doesn't take the others down with it.
 * Only throws when every single one fails, so the section-level error banner has something
 * concrete to report. */
async function mergeSources<T>(fetchers: (() => Promise<T[]>)[]): Promise<T[]> {
  const results = await Promise.allSettled(fetchers.map((f) => f()));
  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (items.length === 0) {
    const firstFailure = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    throw firstFailure?.reason instanceof Error
      ? firstFailure.reason
      : new Error(String(firstFailure?.reason ?? "sem resultados"));
  }
  return items;
}

function sortByPublishedDesc<T extends { publishedAt: string }>(items: T[]): T[] {
  return items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
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

async function fetchDevToNews(): Promise<NewsCardData[]> {
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

const HN_TOP_STORIES_URL = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_STORY_LIMIT = 20;

interface HnItem {
  id: number;
  title?: string;
  url?: string;
  by?: string;
  time?: number;
  deleted?: boolean;
  dead?: boolean;
}

/** The official Firebase-backed Hacker News API — no key, `Access-Control-Allow-Origin: *`.
 * There's no bulk "top N with details" endpoint, so this fetches the id list then each story
 * individually (capped at HN_STORY_LIMIT to keep it to one small burst of requests). */
async function fetchHackerNews(): Promise<NewsCardData[]> {
  const idsRes = await fetch(HN_TOP_STORIES_URL);
  if (!idsRes.ok) throw new Error(`Hacker News respondeu ${idsRes.status}`);
  const ids = ((await idsRes.json()) as number[]).slice(0, HN_STORY_LIMIT);
  const items = await Promise.all(
    ids.map((id) =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) =>
        r.ok ? (r.json() as Promise<HnItem>) : null,
      ),
    ),
  );
  return items
    .filter((i): i is HnItem => i !== null && !i.deleted && !i.dead && Boolean(i.title))
    .map((i) => ({
      id: `hn-${i.id}`,
      kind: "news" as const,
      title: i.title ?? "",
      url: i.url ?? `https://news.ycombinator.com/item?id=${i.id}`,
      source: "Hacker News",
      author: i.by ?? "",
      summary: "",
      publishedAt: i.time ? new Date(i.time * 1000).toISOString() : new Date().toISOString(),
      tags: [],
    }));
}

/**
 * Two more general-news APIs were checked for the "Internacional" news bucket and dropped:
 * - Noozra (noozra.com/api): free, no key, real CORS — but its "tech" category is consumer-tech
 *   (gadgets, robotaxis, soundbar reviews, even a movie review) rather than dev/programming
 *   news, confirmed by pulling a live sample — a poor fit next to dev.to/Hacker News.
 * - saurav.tech/NewsAPI (a static newsapi.org mirror): CORS is fine, but every article in its
 *   "technology" category is dated April 2022 — the mirror stopped updating years ago.
 */
export async function fetchTechNews(): Promise<NewsCardData[]> {
  return sortByPublishedDesc(await mergeSources([fetchDevToNews, fetchHackerNews]));
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

async function fetchRemotiveJobs(): Promise<JobCardData[]> {
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
    allTags: j.tags,
    entryLevel: detectEntryLevel(j.title),
  }));
}

const JOBICY_JOBS_URL = "https://jobicy.com/api/v2/remote-jobs?count=40&industry=dev";

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobGeo: string;
  jobExcerpt: string;
  pubDate: string;
  jobIndustry: string[];
}

async function fetchJobicyJobs(): Promise<JobCardData[]> {
  const res = await fetch(JOBICY_JOBS_URL);
  if (!res.ok) throw new Error(`Jobicy respondeu ${res.status}`);
  const data = (await res.json()) as { jobs?: JobicyJob[] };
  return (data.jobs ?? []).slice(0, 40).map((j) => ({
    id: `jobicy-${j.id}`,
    kind: "job" as const,
    title: j.jobTitle,
    url: j.url,
    source: "Jobicy",
    company: j.companyName,
    location: j.jobGeo || "",
    summary: truncate(stripHtml(j.jobExcerpt ?? ""), 220),
    publishedAt: j.pubDate,
    tags: (j.jobIndustry ?? []).slice(0, 4),
    allTags: j.jobIndustry ?? [],
    entryLevel: detectEntryLevel(j.jobTitle),
  }));
}

const ARBEITNOW_JOBS_URL = "https://www.arbeitnow.com/api/job-board-api";
/** Arbeitnow is a DACH-region board (Germany/Austria/Switzerland) — most listings are local
 * on-site roles there, not Brazil-relevant, so this belongs in the "Internacional" bucket, not
 * "Brasil" (kept separate from the earlier Fase D note that discarded it for the Brazil bucket
 * specifically). CORS confirmed live (`Access-Control-Allow-Origin: *`). Only its small `remote`
 * subset is used here, further filtered client-side to dev-relevant tags/titles since most of
 * that subset is non-tech (sales, marketing, design...). */
const ARBEITNOW_DEV_RE =
  /develop|engineer|software|backend|front[- ]?end|full[- ]?stack|programmer|\bdev\b|devops|data scientist|\bsre\b|systemadministrator|informatik/i;

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  location: string;
  /** Unix seconds, like Himalayas' pubDate — not an ISO string. */
  created_at: number;
}

async function fetchArbeitnowJobs(): Promise<JobCardData[]> {
  const res = await fetch(ARBEITNOW_JOBS_URL);
  if (!res.ok) throw new Error(`Arbeitnow respondeu ${res.status}`);
  const data = (await res.json()) as { data?: ArbeitnowJob[] };
  const relevant = (data.data ?? []).filter(
    (j) =>
      j.remote &&
      (ARBEITNOW_DEV_RE.test(j.title) || j.tags.some((t) => ARBEITNOW_DEV_RE.test(t))),
  );
  return relevant.map((j) => ({
    id: `arbeitnow-${j.slug}`,
    kind: "job" as const,
    title: j.title,
    url: j.url,
    source: "Arbeitnow",
    company: j.company_name,
    location: j.location || "",
    summary: truncate(stripHtml(j.description ?? ""), 220),
    publishedAt: new Date(j.created_at * 1000).toISOString(),
    tags: j.tags.slice(0, 4),
    allTags: j.tags,
    entryLevel: detectEntryLevel(j.title),
  }));
}

export async function fetchRemoteJobs(): Promise<JobCardData[]> {
  return sortByPublishedDesc(
    await mergeSources([fetchRemotiveJobs, fetchJobicyJobs, fetchArbeitnowJobs]),
  );
}

/**
 * Brazil-focused sources — validated live before wiring up (all free, no API key):
 * - News: TabNews (tabnews.com.br), a Brazilian dev community (Hacker-News-like). Its public
 *   API sends `Access-Control-Allow-Origin: *`.
 * - Jobs: GitHub Issues on frontendbr/vagas, backend-br/vagas, react-brasil/vagas,
 *   soujava/vagas-java, qa-brasil/vagas, DevOps-Brasil/Vagas and vuejs-br/vagas — seven actively
 *   maintained community job boards (frontendbr/vagas, soujava/vagas-java and DevOps-Brasil/Vagas
 *   had issues posted the same day at validation time; qa-brasil/vagas and vuejs-br/vagas within
 *   the last ~2-3 weeks) where each opening is a GitHub issue titled "[Location] Role - Company"
 *   with real skill labels attached. Queried through api.github.com, which also sends
 *   `Access-Control-Allow-Origin: *`, no token needed (60 req/hour per visitor's own IP —
 *   plenty for one fetch per page load).
 *   Also CangaceirosDevels/vagas_de_emprego (a Ceará dev community board) — added per explicit
 *   request, but flagged here transparently: its 5 open issues are mostly remote roles (not
 *   Fortaleza-specific despite the community's origin) and the newest one dates to Feb/2025 —
 *   technically alive (not archived) but posting activity has clearly slowed to a trickle. Kept
 *   because a stale-but-real source degrades gracefully (mergeSources just contributes fewer
 *   items, same as any other quiet source) rather than breaking anything.
 *   Plus job-finder (see fetchBrazilEntryLevelJobs below) specifically for entry-level roles,
 *   and Himalayas (see fetchHimalayasJobs below), filtered to jobs open to Brazil-based
 *   candidates, proxied through /api/himalayas since that one doesn't send CORS headers.
 * Other candidates were checked and are NOT in this Brazil bucket:
 * - Arbeitnow: DACH-region (Germany/Austria/Switzerland), not Brazil — used instead in the
 *   "Internacional" bucket, see fetchArbeitnowJobs below.
 * - remotejobsbr/jobs (a GitHub-issues aggregator): archived since 2018.
 * - alinebastos/vagas-junior-estagio: a curated README list, not individual live postings
 *   (0 open issues) — nothing to poll.
 * - alinebastos/contrate-junior-estagio: issues here are candidates advertising *themselves*
 *   ("[City] Full Name"), the inverse of what this feed needs (job postings, not résumés).
 * - frontend-ce/vagas: 0 open issues at validation time — empty, nothing to poll.
 */
const TABNEWS_URL = "https://www.tabnews.com.br/api/v1/contents?strategy=new&page=1&per_page=30";
/** DevOps-Brasil/Vagas titles are less consistent than the other boards' — some use "[Role tags]
 * Company - Location" or double brackets ("[City] [Modality] Role - Level") instead of the usual
 * "[Location] Role - Company", so parseGithubJobTitle occasionally reads a level word (e.g.
 * "Pleno") as the company there. Not chased further — the title/location still read fine, only
 * that one field is sometimes off, same class of harmless quirk as other sources' odd titles. */
const BRAZIL_JOB_BOARDS = [
  "frontendbr/vagas",
  "backend-br/vagas",
  "react-brasil/vagas",
  "soujava/vagas-java",
  "qa-brasil/vagas",
  "CangaceirosDevels/vagas_de_emprego",
  "DevOps-Brasil/Vagas",
  "vuejs-br/vagas",
];

interface TabNewsContent {
  id: string;
  slug: string;
  title: string;
  owner_username: string;
  published_at: string;
}

export async function fetchBrazilNews(): Promise<NewsCardData[]> {
  const res = await fetch(TABNEWS_URL);
  if (!res.ok) throw new Error(`TabNews respondeu ${res.status}`);
  const items = (await res.json()) as TabNewsContent[];
  return items.map((i) => ({
    id: `tabnews-${i.id}`,
    kind: "news" as const,
    title: i.title,
    url: `https://www.tabnews.com.br/${i.owner_username}/${i.slug}`,
    source: "TabNews",
    author: i.owner_username,
    summary: "",
    publishedAt: i.published_at,
    tags: [],
  }));
}

function stripMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_`>~-]/g, " ")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** GitHub job-issue titles look like "[Remoto] Backend Developer - Acme", "[Híbrido em São
 * Paulo] Java Backend Sênior", "[Remota] Front-End Sênior na Sylision" (react-brasil/vagas) or
 * "[Remoto] Front-end Vue.js Developer Pleno @ Sylision" (vuejs-br/vagas). Pulls the bracketed
 * location and, when present, the company after the last " - ", " @ " or " na ". */
function parseGithubJobTitle(raw: string): { location: string; title: string; company: string } {
  const bracketMatch = raw.match(/^\[([^\]]+)\]\s*/);
  const location = bracketMatch ? bracketMatch[1].trim() : "";
  const rest = (bracketMatch ? raw.slice(bracketMatch[0].length) : raw).trim();
  const dashIdx = rest.lastIndexOf(" - ");
  if (dashIdx !== -1) {
    return { location, title: rest.slice(0, dashIdx).trim(), company: rest.slice(dashIdx + 3).trim() };
  }
  const atIdx = rest.lastIndexOf(" @ ");
  if (atIdx !== -1) {
    return { location, title: rest.slice(0, atIdx).trim(), company: rest.slice(atIdx + 3).trim() };
  }
  const naMatch = rest.match(/\s+na\s+([^-]+)$/i);
  if (naMatch && naMatch.index !== undefined) {
    return { location, title: rest.slice(0, naMatch.index).trim(), company: naMatch[1].trim() };
  }
  return { location, title: rest || raw, company: "" };
}

interface GithubIssue {
  id: number;
  html_url: string;
  title: string;
  body: string | null;
  created_at: string;
  labels: { name: string }[];
  pull_request?: unknown;
}

async function fetchGithubJobBoard(repo: string): Promise<JobCardData[]> {
  const res = await fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=30`);
  if (!res.ok) throw new Error(`${repo} respondeu ${res.status}`);
  const issues = (await res.json()) as GithubIssue[];
  return issues
    .filter((i) => !i.pull_request)
    .map((i) => {
      const { location, title, company } = parseGithubJobTitle(i.title);
      const allTags = i.labels.map((l) => l.name);
      return {
        id: `gh-${repo}-${i.id}`,
        kind: "job" as const,
        title,
        url: i.html_url,
        source: repo,
        company,
        location,
        summary: truncate(stripMarkdown(i.body ?? ""), 220),
        publishedAt: i.created_at,
        tags: allTags.slice(0, 4),
        allTags,
        entryLevel: detectEntryLevel(title),
      };
    });
}

const JOBFINDER_URL = "https://alexchequer.github.io/job-finder/jobs.json";
/** job-finder tracks early-career openings (estágio/junior/trainee) at large Brazilian tech
 * and finance companies, polled daily from their Greenhouse/Lever/Gupy listings by a GitHub
 * Actions cron and published as a static JSON file on GitHub Pages — MIT-licensed, no key,
 * `Access-Control-Allow-Origin: *`, confirmed updated same-day at validation time. It's a small,
 * single-maintainer project (not a widely-starred community board like the others here), so
 * treat it as the first one to watch if a source ever needs dropping. Keeps only postings tagged
 * for a tech-adjacent area — the feed skips its "juridico"-only openings, for example. */
const JOBFINDER_TECH_AREAS = new Set(["software", "dados", "engenharia"]);

interface JobFinderJob {
  id: string;
  company: string;
  title: string;
  location: string;
  url: string;
  level: "junior" | "estagio";
  areas: string[];
  firstSeen: string;
  summary: string;
}

async function fetchBrazilEntryLevelJobs(): Promise<JobCardData[]> {
  const res = await fetch(JOBFINDER_URL);
  if (!res.ok) throw new Error(`job-finder respondeu ${res.status}`);
  const data = (await res.json()) as { jobs?: JobFinderJob[] };
  return (data.jobs ?? [])
    .filter((j) => j.areas.some((a) => JOBFINDER_TECH_AREAS.has(a)))
    .map((j) => ({
      id: `jobfinder-${j.id}`,
      kind: "job" as const,
      title: j.title,
      url: j.url,
      source: "job-finder",
      company: j.company,
      location: j.location || "",
      summary: j.summary ?? "",
      publishedAt: j.firstSeen,
      tags: j.areas.slice(0, 4),
      allTags: j.areas,
      entryLevel: j.level,
    }));
}

/** Himalayas' `country`/`category` search params turned out to be no-ops server-side (same
 * `totalCount` and same mix of unrelated categories with or without them — same pattern as
 * RemoteOK's tags param), so relevance is filtered client-side by `parentCategories` instead. */
const HIMALAYAS_RELEVANT_CATEGORIES = new Set(["Developer", "Data", "DevOps", "IT"]);

interface HimalayasJob {
  title: string;
  excerpt: string;
  companyName: string;
  seniority: string[];
  locationRestrictions: string[];
  categories: string[];
  parentCategories: string[];
  /** Unix seconds, NOT an ISO string like every other source here — confirmed live (e.g.
   * 1788322259). Converted below before it ever reaches relativeTime()/sort-by-date. */
  pubDate: number;
  applicationLink: string;
  guid: string;
}

async function fetchHimalayasJobs(): Promise<JobCardData[]> {
  const res = await fetch("/api/himalayas?country=Brazil&page=1");
  if (!res.ok) throw new Error(`Himalayas respondeu ${res.status}`);
  const data = (await res.json()) as { jobs?: HimalayasJob[] };
  const relevant = (data.jobs ?? []).filter((j) =>
    j.parentCategories.some((c) => HIMALAYAS_RELEVANT_CATEGORIES.has(c)),
  );
  return relevant.map((j) => ({
    id: `himalayas-${j.guid}`,
    kind: "job" as const,
    title: j.title,
    url: j.applicationLink,
    source: "Himalayas",
    company: j.companyName,
    location: j.locationRestrictions.join(", "),
    summary: truncate(stripHtml(j.excerpt ?? ""), 220),
    publishedAt: new Date(j.pubDate * 1000).toISOString(),
    tags: j.categories.slice(0, 4),
    allTags: j.categories,
    entryLevel: j.seniority.includes("Entry-level") ? "junior" : detectEntryLevel(j.title),
  }));
}

export async function fetchBrazilJobs(): Promise<JobCardData[]> {
  const items = await mergeSources([
    ...BRAZIL_JOB_BOARDS.map((repo) => () => fetchGithubJobBoard(repo)),
    fetchBrazilEntryLevelJobs,
    fetchHimalayasJobs,
  ]);
  return sortByPublishedDesc(items);
}

/**
 * Job-match score for the feed, separate from JobMatchPanel's matchKeywords/keywords.ts (that
 * one stays untouched — it's tuned for a whole pasted job description, a different shape of
 * input). Remotive tags a job with its entire category's tech stack (~45 generic tags is
 * common), which used to swamp a single frequency-based keyword extraction and made every
 * job look like a poor match regardless of resume quality. Here, title+summary (the actual job
 * content) and tags (a broad, noisy hint) are scored independently and combined with fixed
 * weights, so a long tag list can never contribute more than TAG_WEIGHT of the total — it can
 * only nudge the score, never dominate it.
 */
const JOB_MATCH_TEXT_WEIGHT = 0.7;
const JOB_MATCH_TAG_WEIGHT = 0.3;

function matchRatio(results: { matched: boolean }[]): number {
  return results.length > 0 ? results.filter((r) => r.matched).length / results.length : 0;
}

export function computeJobMatchPct(job: JobCardData, resumeData: ResumeData, locale: Locale): number {
  const textResults = matchKeywords(`${job.title} ${job.summary}`, resumeData, locale);
  const tagResults = job.allTags.length > 0 ? matchKeywords(job.allTags.join(" "), resumeData, locale) : [];

  if (textResults.length === 0 && tagResults.length === 0) return 0;
  if (textResults.length === 0) return Math.round(matchRatio(tagResults) * 100);
  if (tagResults.length === 0) return Math.round(matchRatio(textResults) * 100);

  const score =
    matchRatio(textResults) * JOB_MATCH_TEXT_WEIGHT + matchRatio(tagResults) * JOB_MATCH_TAG_WEIGHT;
  return Math.round(score * 100);
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
