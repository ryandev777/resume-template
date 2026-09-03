"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  computeJobMatchPct,
  fetchBrazilJobs,
  fetchBrazilNews,
  fetchRemoteJobs,
  fetchTechNews,
  relativeTime,
  type EntryLevel,
  type FeedCardData,
  type JobCardData,
  type NewsCardData,
} from "@/lib/feed";
import { isResumeEmpty } from "@/lib/score";
import { getResumeData, useResumeStore } from "@/lib/store";
import type { Locale } from "@/lib/types";

type Region = "br" | "intl";

/** Green/amber/red bands for the job-match percentage badge and its progress bar. */
function matchBandClasses(pct: number): { badge: string; bar: string } {
  if (pct >= 60) return { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" };
  if (pct >= 30) return { badge: "bg-amber-100 text-amber-800", bar: "bg-amber-500" };
  return { badge: "bg-red-100 text-red-700", bar: "bg-red-500" };
}

/** One consistent color + initials per source, used for the card's avatar circle — the
 * feed's small fixed set of sources (see lib/feed.ts), not a hash-based scheme, so each one
 * stays recognizable and stable across sessions. */
const SOURCE_AVATARS: Record<string, { bg: string; initials: string }> = {
  "dev.to": { bg: "bg-zinc-900", initials: "DEV" },
  "Hacker News": { bg: "bg-amber-500", initials: "HN" },
  Remotive: { bg: "bg-teal-600", initials: "RM" },
  Jobicy: { bg: "bg-fuchsia-600", initials: "JB" },
  TabNews: { bg: "bg-indigo-600", initials: "TN" },
  "frontendbr/vagas": { bg: "bg-pink-600", initials: "FE" },
  "backend-br/vagas": { bg: "bg-orange-600", initials: "BE" },
  "react-brasil/vagas": { bg: "bg-sky-600", initials: "RB" },
  "job-finder": { bg: "bg-rose-600", initials: "JF" },
};
const DEFAULT_SOURCE_AVATAR = { bg: "bg-slate-500", initials: "•" };

function SourceAvatar({ source }: { source: string }) {
  const { bg, initials } = SOURCE_AVATARS[source] ?? DEFAULT_SOURCE_AVATAR;
  return (
    <div
      className={
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white " +
        bg
      }
      aria-hidden
    >
      {initials}
    </div>
  );
}

type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; items: T[] };

type Filter = "all" | "news" | "jobs";
type DateFilter = "all" | "24h" | "week" | "month";

const DATE_FILTER_WINDOW_MS: Record<Exclude<DateFilter, "all">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

function withinDateFilter(item: FeedCardData, dateFilter: DateFilter): boolean {
  if (dateFilter === "all") return true;
  const publishedAt = new Date(item.publishedAt).getTime();
  if (Number.isNaN(publishedAt)) return true;
  return Date.now() - publishedAt <= DATE_FILTER_WINDOW_MS[dateFilter];
}

function TypeBadge({ kind, locale }: { kind: "news" | "job"; locale: Locale }) {
  const pt = locale === "pt-br";
  const isNews = kind === "news";
  return (
    <span
      className={
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
        (isNews ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700")
      }
    >
      <span aria-hidden>{isNews ? "📰" : "💼"}</span>
      {isNews ? (pt ? "Notícia" : "News") : pt ? "Vaga" : "Job"}
    </span>
  );
}

const ENTRY_LEVEL_LABELS: Record<EntryLevel, { pt: string; en: string; icon: string }> = {
  estagio: { pt: "Estágio", en: "Internship", icon: "🎓" },
  trainee: { pt: "Trainee", en: "Trainee", icon: "🌱" },
  junior: { pt: "Júnior", en: "Junior", icon: "🌱" },
};

/** Surfaces entry-level roles (internship/trainee/junior) at a glance in a mixed feed — see
 * detectEntryLevel in lib/feed.ts. No new filter yet, just a badge. */
function EntryLevelBadge({ level, locale }: { level: EntryLevel; locale: Locale }) {
  const { pt, en, icon } = ENTRY_LEVEL_LABELS[level];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
      <span aria-hidden>{icon}</span>
      {locale === "pt-br" ? pt : en}
    </span>
  );
}

function NewsCard({ item, locale }: { item: NewsCardData; locale: Locale }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <SourceAvatar source={item.source} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <TypeBadge kind="news" locale={locale} />
          <span className="text-[11px] font-semibold text-slate-700">{item.source}</span>
          {item.author && <span className="text-[11px] text-slate-400">· {item.author}</span>}
          <span className="text-[11px] text-slate-400">· {relativeTime(item.publishedAt, locale)}</span>
        </div>
        <h3 className="mt-1.5 break-words text-base font-bold leading-snug text-slate-900 group-hover:text-slate-700">
          {item.title}
        </h3>
        {item.summary && (
          <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">{item.summary}</p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

function JobCard({
  item,
  locale,
  resumeEmpty,
  matchPct,
}: {
  item: JobCardData;
  locale: Locale;
  resumeEmpty: boolean;
  matchPct: number | undefined;
}) {
  const pt = locale === "pt-br";
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <SourceAvatar source={item.source} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <TypeBadge kind="job" locale={locale} />
          {item.entryLevel && <EntryLevelBadge level={item.entryLevel} locale={locale} />}
          <span className="text-[11px] font-semibold text-slate-700">{item.source}</span>
          {item.company && <span className="text-[11px] text-slate-400">· {item.company}</span>}
          <span className="text-[11px] text-slate-400">· {relativeTime(item.publishedAt, locale)}</span>
        </div>
        <h3 className="mt-1.5 break-words text-base font-bold leading-snug text-slate-900 group-hover:text-slate-700">
          {item.title}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {item.location || (locale === "pt-br" ? "Remoto" : "Remote")}
        </p>

        {resumeEmpty ? (
          <p className="mt-1.5 text-[11px] text-slate-400">
            {pt
              ? "Preencha seu currículo para ver a compatibilidade"
              : "Fill in your resume to see match compatibility"}
          </p>
        ) : (
          matchPct !== undefined && (
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                  matchBandClasses(matchPct).badge
                }
              >
                {pt ? `${matchPct}% compatível` : `${matchPct}% match`}
              </span>
              <div className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={"h-full rounded-full " + matchBandClasses(matchPct).bar}
                  style={{ width: `${matchPct}%` }}
                />
              </div>
            </div>
          )
        )}

        {item.summary && (
          <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">{item.summary}</p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

function ErrorBanner({
  label,
  message,
  locale,
  onRetry,
}: {
  label: string;
  message: string;
  locale: Locale;
  onRetry: () => void;
}) {
  const pt = locale === "pt-br";
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <p>
        {pt
          ? `${label}: não foi possível carregar agora (${message}).`
          : `${label}: couldn't load this right now (${message}).`}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
      >
        {pt ? "Tentar de novo" : "Try again"}
      </button>
    </div>
  );
}

const FILTERS: Filter[] = ["all", "news", "jobs"];

function filterLabel(filter: Filter, pt: boolean): string {
  if (filter === "all") return pt ? "Tudo" : "All";
  if (filter === "news") return pt ? "Notícias" : "News";
  return pt ? "Vagas" : "Jobs";
}

const INITIAL_VISIBLE_COUNT = 15;
const LOAD_MORE_BATCH = 10;
/** Small artificial pause before revealing the next batch — items are already fetched, so this
 * is purely to make the skeleton at the bottom perceptible instead of an instant snap. */
const REVEAL_DELAY_MS = 300;

const REGIONS: Region[] = ["br", "intl"];

function regionLabel(region: Region, pt: boolean): string {
  if (region === "br") return pt ? "Brasil" : "Brazil";
  return pt ? "Internacional" : "International";
}

const DATE_FILTERS: DateFilter[] = ["all", "24h", "week", "month"];

function dateFilterLabel(dateFilter: DateFilter, pt: boolean): string {
  if (dateFilter === "all") return pt ? "Todos" : "All";
  if (dateFilter === "24h") return pt ? "Últimas 24h" : "Last 24h";
  if (dateFilter === "week") return pt ? "Última semana" : "Last week";
  return pt ? "Último mês" : "Last month";
}

/** Fetches once on mount (and again whenever `retry()` bumps the internal reload key), keeping
 * each feed source's loading/error/ok state independent of the others. */
function useFeedSource<T>(fetchFn: () => Promise<T[]>): [LoadState<T>, () => void] {
  const [state, setState] = useState<LoadState<T>>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchFn()
      .then((items) => {
        if (!cancelled) setState({ status: "ok", items });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, fetchFn]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setReloadKey((k) => k + 1);
  }, []);

  return [state, retry];
}

export default function FeedPage() {
  const locale = useResumeStore((s) => s.locale);
  const pt = locale === "pt-br";
  // See ScorePanel.tsx / JobMatchPanel.tsx — getResumeData returns a new object every call,
  // so it needs useShallow or React logs a getSnapshot-consistency warning on every render.
  const resumeData = useResumeStore(useShallow((s) => getResumeData(s)));
  const resumeEmpty = isResumeEmpty(resumeData);
  const [filter, setFilter] = useState<Filter>("all");
  // Brazil is the default: this app is built for Brazilian devs (see the homepage), and Fase D
  // was specifically about surfacing the Brazilian market instead of only English-language feeds.
  const [region, setRegion] = useState<Region>("br");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [newsBR, retryNewsBR] = useFeedSource(fetchBrazilNews);
  const [jobsBR, retryJobsBR] = useFeedSource(fetchBrazilJobs);
  const [newsIntl, retryNewsIntl] = useFeedSource(fetchTechNews);
  const [jobsIntl, retryJobsIntl] = useFeedSource(fetchRemoteJobs);

  const news = region === "br" ? newsBR : newsIntl;
  const jobs = region === "br" ? jobsBR : jobsIntl;
  const handleRetryNews = region === "br" ? retryNewsBR : retryNewsIntl;
  const handleRetryJobs = region === "br" ? retryJobsBR : retryJobsIntl;

  const wantsNews = filter !== "jobs";
  const wantsJobs = filter !== "news";
  const isLoading = (wantsNews && news.status === "loading") || (wantsJobs && jobs.status === "loading");
  const newsFailed = wantsNews && news.status === "error";
  const jobsFailed = wantsJobs && jobs.status === "error";

  const combinedItems = useMemo(() => {
    const items: FeedCardData[] = [];
    if (wantsNews && news.status === "ok") items.push(...news.items);
    if (wantsJobs && jobs.status === "ok") items.push(...jobs.items);
    return items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [news, jobs, wantsNews, wantsJobs]);

  // Date/recency filter composes with type + region above — still just narrowing the same
  // already-fetched, already-sorted array, so chronological order and "no new fetch" both hold.
  const dateFilteredItems = useMemo(
    () => combinedItems.filter((item) => withinDateFilter(item, dateFilter)),
    [combinedItems, dateFilter],
  );

  // % of the job's own keywords (title + summary + tags) that also appear in the resume —
  // reuses the same matchKeywords logic as JobMatchPanel.tsx, just run per job card here.
  const jobMatches = useMemo(() => {
    const map = new Map<string, number>();
    if (resumeEmpty || jobs.status !== "ok") return map;
    for (const job of jobs.items) {
      map.set(job.id, computeJobMatchPct(job, resumeData, locale));
    }
    return map;
  }, [jobs, resumeEmpty, resumeData, locale]);

  // Infinite scroll reveals more of the already-fetched, already-sorted `combinedItems` — no
  // extra network calls, so switching filters can't ever desync the chronological order. Resets
  // to the first page whenever the active filter/region changes the underlying item set.
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [revealingMore, setRevealingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset the reveal window when the active filter/region/date range changes the underlying
  // item set. The search box deliberately does NOT reset this or trigger reveals — it only
  // narrows what's already been revealed (see searchFilteredItems below). Adjusted directly
  // during render (React's documented pattern for "reset state when a prop changes") rather
  // than in an effect, so it takes effect before this render paints instead of flashing the
  // old page first.
  const [prevResetKey, setPrevResetKey] = useState<[Filter, Region, DateFilter]>([
    filter,
    region,
    dateFilter,
  ]);
  if (
    prevResetKey[0] !== filter ||
    prevResetKey[1] !== region ||
    prevResetKey[2] !== dateFilter
  ) {
    setPrevResetKey([filter, region, dateFilter]);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  const visibleItems = dateFilteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < dateFilteredItems.length;

  // Keyword search over title/summary/tags — scoped to items already revealed by infinite
  // scroll (no new fetch, no reach into sources/pages outside the active filters).
  const searchFilteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleItems;
    return visibleItems.filter((item) => {
      const haystack = [item.title, item.summary, ...item.tags].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [visibleItems, searchQuery]);

  useEffect(() => {
    // Mirrors the `!isLoading && hasMore` condition the sentinel div itself is rendered
    // under — without `isLoading` here too, this can fire on a render where one source
    // resolved before another (making `hasMore` true) while the sentinel still isn't
    // mounted yet (because `isLoading` is still true), leaving `sentinelRef.current` null.
    if (isLoading || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    let revealTimeout: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !revealTimeout) {
          setRevealingMore(true);
          revealTimeout = setTimeout(() => {
            setVisibleCount((v) => v + LOAD_MORE_BATCH);
            setRevealingMore(false);
            revealTimeout = null;
          }, REVEAL_DELAY_MS);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (revealTimeout) clearTimeout(revealTimeout);
    };
  }, [isLoading, hasMore]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-slate-900">
          ← resume-template
        </Link>
        <Link
          href="/builder"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          {pt ? "Meu currículo" : "My resume"}
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {pt ? "Notícias e vagas" : "News and jobs"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {region === "br"
            ? pt
              ? "Notícias da comunidade dev brasileira (TabNews) e vagas de boards mantidos pela comunidade no GitHub (frontendbr/vagas, backend-br/vagas, react-brasil/vagas) mais oportunidades de estágio/júnior via job-finder, carregadas direto do navegador — sem servidor próprio, sem cadastro. Clique num card para abrir a matéria ou vaga completa na fonte."
              : "News from the Brazilian dev community (TabNews) and jobs from community-run GitHub boards (frontendbr/vagas, backend-br/vagas, react-brasil/vagas) plus entry-level openings via job-finder, loaded straight from your browser — no backend, no sign-up. Click a card to open the full article or job post at the source."
            : pt
              ? "Notícias de tecnologia (dev.to, Hacker News) e vagas remotas de desenvolvimento (Remotive, Jobicy), carregadas direto do navegador — sem servidor próprio, sem cadastro. O conteúdo é majoritariamente em inglês, vindo direto das fontes originais. Clique num card para abrir a matéria ou vaga completa na fonte."
              : "Tech news (dev.to, Hacker News) and remote dev jobs (Remotive, Jobicy), loaded straight from your browser — no backend, no sign-up. Click a card to open the full article or job post at the source."}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium " +
                  (region === r
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }
              >
                {regionLabel(r, pt)}
              </button>
            ))}
          </div>
          {/* Only meaningful when both button groups share a row — on narrow screens they
              wrap onto separate lines already, so the divider would float alone at the end
              of the first line with nothing to divide. */}
          <div className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium " +
                  (filter === f
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }
              >
                {filterLabel(f, pt)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {DATE_FILTERS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDateFilter(d)}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium " +
                  (dateFilter === d
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }
              >
                {dateFilterLabel(d, pt)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              pt
                ? "Buscar por palavra-chave nos itens já carregados…"
                : "Search by keyword in the loaded items…"
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div className="mt-5 space-y-4">
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          )}

          {!isLoading && (newsFailed || jobsFailed) && (
            <div className="space-y-2">
              {newsFailed && (
                <ErrorBanner
                  label={pt ? "Notícias" : "News"}
                  message={news.status === "error" ? news.message : ""}
                  locale={locale}
                  onRetry={handleRetryNews}
                />
              )}
              {jobsFailed && (
                <ErrorBanner
                  label={pt ? "Vagas" : "Jobs"}
                  message={jobs.status === "error" ? jobs.message : ""}
                  locale={locale}
                  onRetry={handleRetryJobs}
                />
              )}
            </div>
          )}

          {!isLoading && !newsFailed && !jobsFailed && dateFilteredItems.length === 0 && (
            <p className="text-sm text-slate-500">
              {pt ? "Nada encontrado no momento." : "Nothing found right now."}
            </p>
          )}

          {!isLoading &&
            dateFilteredItems.length > 0 &&
            searchQuery.trim() !== "" &&
            searchFilteredItems.length === 0 && (
              <p className="text-sm text-slate-500">
                {pt
                  ? `Nenhum resultado para "${searchQuery.trim()}" nos itens já carregados. Role mais pra baixo ou ajuste os filtros.`
                  : `No results for "${searchQuery.trim()}" in the items loaded so far. Scroll down or adjust the filters.`}
              </p>
            )}

          {!isLoading &&
            searchFilteredItems.map((item) =>
              item.kind === "news" ? (
                <NewsCard key={item.id} item={item} locale={locale} />
              ) : (
                <JobCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  resumeEmpty={resumeEmpty}
                  matchPct={jobMatches.get(item.id)}
                />
              ),
            )}

          {!isLoading && hasMore && (
            <div ref={sentinelRef}>
              {revealingMore && (
                <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
