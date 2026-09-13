import { create } from "zustand";
import { persist } from "zustand/middleware";
import { detectEntryLevel, mergeSources, type FeedCardData, type JobCardData, type NewsCardData } from "./feed";

export type CustomSourceKind = "jobs" | "news";

export interface CustomSource {
  id: string;
  url: string;
  label: string;
  kind: CustomSourceKind;
  active: boolean;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface CustomSourcesStore {
  sources: CustomSource[];
  addSource: (input: { url: string; label: string; kind: CustomSourceKind }) => void;
  removeSource: (id: string) => void;
  toggleSource: (id: string) => void;
}

/** User-added RSS/Atom feed sources — separate persisted store from useResumeStore/
 * useApplicationsStore (same zustand + persist(localStorage) pattern, own lifecycle/key). */
export const useCustomSourcesStore = create<CustomSourcesStore>()(
  persist(
    (set) => ({
      sources: [],
      addSource: ({ url, label, kind }) =>
        set((state) => ({
          sources: [...state.sources, { id: uid(), url: url.trim(), label: label.trim(), kind, active: true }],
        })),
      removeSource: (id) => set((state) => ({ sources: state.sources.filter((s) => s.id !== id) })),
      toggleSource: (id) =>
        set((state) => ({
          sources: state.sources.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
        })),
    }),
    { name: "resume-builder-custom-sources" },
  ),
);

function textOf(el: Element | null): string {
  return el?.textContent?.trim() ?? "";
}

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

interface RawFeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

/** Parses both RSS 2.0 (<item>) and Atom (<entry>) shapes with the native DOMParser — no new
 * library. Returns [] (rather than throwing) for anything that doesn't parse as XML at all, so
 * one malformed feed just contributes nothing instead of breaking the merge. */
function parseFeedItems(xml: string): RawFeedItem[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) return [];

  const rssItems = Array.from(doc.querySelectorAll("item"));
  if (rssItems.length > 0) {
    return rssItems.map((item) => ({
      title: textOf(item.querySelector("title")),
      link: textOf(item.querySelector("link")),
      pubDate: textOf(item.querySelector("pubDate")) || textOf(item.querySelector("date")),
      description: textOf(item.querySelector("description")) || textOf(item.querySelector("summary")),
    }));
  }

  return Array.from(doc.querySelectorAll("entry")).map((entry) => {
    const linkEl = entry.querySelector("link[href]") ?? entry.querySelector("link");
    return {
      title: textOf(entry.querySelector("title")),
      link: linkEl?.getAttribute("href") ?? textOf(linkEl),
      pubDate: textOf(entry.querySelector("updated")) || textOf(entry.querySelector("published")),
      description: textOf(entry.querySelector("summary")) || textOf(entry.querySelector("content")),
    };
  });
}

function toPublishedAt(pubDate: string): string {
  const parsed = new Date(pubDate);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

/** Converts raw RSS/Atom items into the same FeedCardData shape the API-backed sources use, so
 * they render with the existing NewsCard/JobCard components. `source.kind` (set by the user when
 * adding the feed) decides which of the two shapes each item becomes — there's no reliable way
 * to auto-detect "is this a job posting?" from generic RSS/Atom alone. */
export function parseCustomFeed(xml: string, source: CustomSource): FeedCardData[] {
  const label = source.label || source.url;
  return parseFeedItems(xml)
    .filter((i) => i.title && i.link)
    .map((i): FeedCardData => {
      const publishedAt = toPublishedAt(i.pubDate);
      const summary = truncate(stripHtml(i.description ?? ""), 220);
      const id = `custom-${source.id}-${i.link}`;
      if (source.kind === "jobs") {
        const job: JobCardData = {
          id,
          kind: "job",
          title: i.title,
          url: i.link,
          source: label,
          company: "",
          location: "",
          summary,
          publishedAt,
          tags: [],
          allTags: [],
          entryLevel: detectEntryLevel(i.title),
        };
        return job;
      }
      const news: NewsCardData = {
        id,
        kind: "news",
        title: i.title,
        url: i.link,
        source: label,
        author: "",
        summary,
        publishedAt,
        tags: [],
      };
      return news;
    });
}

/** Fetches one custom source through /api/rss-proxy (avoids third-party CORS issues) and parses
 * it client-side. */
async function fetchCustomSource(source: CustomSource): Promise<FeedCardData[]> {
  const res = await fetch(`/api/rss-proxy?url=${encodeURIComponent(source.url)}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `${source.label || source.url} respondeu ${res.status}`);
  }
  return parseCustomFeed(await res.text(), source);
}

/** Fetches every active custom source in parallel, reusing feed.ts's mergeSources so one broken
 * feed doesn't take the others down with it. Short-circuits on an empty list — mergeSources
 * throws when every fetcher fails, which would misfire as an error state when the user simply
 * hasn't added (or has deactivated) any sources yet. */
export async function fetchAllActiveCustomSources(sources: CustomSource[]): Promise<FeedCardData[]> {
  if (sources.length === 0) return [];
  return mergeSources(sources.map((s) => () => fetchCustomSource(s)));
}
