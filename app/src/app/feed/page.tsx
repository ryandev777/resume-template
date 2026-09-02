"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchRemoteJobs,
  fetchTechNews,
  relativeTime,
  type JobCardData,
  type NewsCardData,
} from "@/lib/feed";
import { useResumeStore } from "@/lib/store";
import type { Locale } from "@/lib/types";

type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; items: T[] };

function NewsCard({ item, locale }: { item: NewsCardData; locale: Locale }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-400"
    >
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <span className="font-medium text-slate-700">{item.source}</span>
        {item.author && <span>· {item.author}</span>}
        <span>· {relativeTime(item.publishedAt, locale)}</span>
      </div>
      <h3 className="mt-1 text-sm font-semibold text-slate-900">{item.title}</h3>
      {item.summary && <p className="mt-1 text-xs text-slate-600">{item.summary}</p>}
      {item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

function JobCard({ item, locale }: { item: JobCardData; locale: Locale }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-400"
    >
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <span className="font-medium text-slate-700">{item.source}</span>
        <span>· {item.company}</span>
        <span>· {relativeTime(item.publishedAt, locale)}</span>
      </div>
      <h3 className="mt-1 text-sm font-semibold text-slate-900">{item.title}</h3>
      <p className="mt-0.5 text-xs text-slate-500">
        {item.location || (locale === "pt-br" ? "Remoto" : "Remote")}
      </p>
      {item.summary && <p className="mt-1 text-xs text-slate-600">{item.summary}</p>}
      {item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

function FeedSection<T extends { id: string }>({
  title,
  state,
  locale,
  onRetry,
  renderItem,
}: {
  title: string;
  state: LoadState<T>;
  locale: Locale;
  onRetry: () => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  const pt = locale === "pt-br";
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>

      {state.status === "loading" && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>
            {pt
              ? `Não foi possível carregar agora (${state.message}).`
              : `Couldn't load this right now (${state.message}).`}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            {pt ? "Tentar de novo" : "Try again"}
          </button>
        </div>
      )}

      {state.status === "ok" && state.items.length === 0 && (
        <p className="text-sm text-slate-500">
          {pt ? "Nada encontrado no momento." : "Nothing found right now."}
        </p>
      )}

      {state.status === "ok" && state.items.length > 0 && (
        <div className="space-y-2">{state.items.map((item) => renderItem(item))}</div>
      )}
    </section>
  );
}

export default function FeedPage() {
  const locale = useResumeStore((s) => s.locale);
  const pt = locale === "pt-br";
  const [news, setNews] = useState<LoadState<NewsCardData>>({ status: "loading" });
  const [jobs, setJobs] = useState<LoadState<JobCardData>>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchTechNews()
      .then((items) => {
        if (!cancelled) setNews({ status: "ok", items });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setNews({ status: "error", message: err instanceof Error ? err.message : String(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    fetchRemoteJobs()
      .then((items) => {
        if (!cancelled) setJobs({ status: "ok", items });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setJobs({ status: "error", message: err instanceof Error ? err.message : String(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function handleRetry() {
    setNews({ status: "loading" });
    setJobs({ status: "loading" });
    setReloadKey((k) => k + 1);
  }

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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {pt ? "Notícias e vagas" : "News and jobs"}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          {pt
            ? "Notícias de tecnologia (dev.to) e vagas remotas de desenvolvimento (Remotive), carregadas direto do navegador — sem servidor próprio, sem cadastro. O conteúdo é majoritariamente em inglês, vindo direto das fontes originais. Clique num card para abrir a matéria ou vaga completa na fonte."
            : "Tech news (dev.to) and remote dev jobs (Remotive), loaded straight from your browser — no backend, no sign-up. Click a card to open the full article or job post at the source."}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <FeedSection
            title={pt ? "Notícias tech" : "Tech news"}
            state={news}
            locale={locale}
            onRetry={handleRetry}
            renderItem={(item) => <NewsCard key={item.id} item={item} locale={locale} />}
          />
          <FeedSection
            title={pt ? "Vagas remotas" : "Remote jobs"}
            state={jobs}
            locale={locale}
            onRetry={handleRetry}
            renderItem={(item) => <JobCard key={item.id} item={item} locale={locale} />}
          />
        </div>
      </main>
    </div>
  );
}
