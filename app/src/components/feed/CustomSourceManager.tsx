"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button, Input, Label } from "@/components/ui";
import { useCustomSourcesStore, type CustomSourceKind } from "@/lib/customSources";
import type { Locale } from "@/lib/types";

function isValidHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const KIND_LABELS: Record<CustomSourceKind, { pt: string; en: string }> = {
  jobs: { pt: "Vagas", en: "Jobs" },
  news: { pt: "Notícias", en: "News" },
};

/** Same modal shell as ShareModal/ConfirmModal. Lets the user manage their own RSS/Atom sources
 * (Fase P) — add/remove/activate — merged into the feed via fetchAllActiveCustomSources. */
export function CustomSourceManager({
  locale,
  onClose,
  feedStatus,
  feedErrorMessage,
  onRetry,
}: {
  locale: Locale;
  onClose: () => void;
  feedStatus: "loading" | "error" | "ok";
  feedErrorMessage?: string;
  onRetry: () => void;
}) {
  const pt = locale === "pt-br";
  const sources = useCustomSourcesStore((s) => s.sources);
  const addSource = useCustomSourcesStore((s) => s.addSource);
  const removeSource = useCustomSourcesStore((s) => s.removeSource);
  const toggleSource = useCustomSourcesStore((s) => s.toggleSource);

  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<CustomSourceKind>("news");

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!isValidHttpsUrl(trimmedUrl)) {
      toast.error(pt ? "Informe uma URL https:// válida." : "Enter a valid https:// URL.");
      return;
    }
    if (sources.some((s) => s.url === trimmedUrl)) {
      toast.error(pt ? "Essa fonte já foi adicionada." : "That source was already added.");
      return;
    }
    addSource({ url: trimmedUrl, label: label.trim(), kind });
    setUrl("");
    setLabel("");
    toast.success(pt ? "Fonte adicionada." : "Source added.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {pt ? "Minhas fontes" : "My sources"}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {pt
            ? "Adicione feeds RSS/Atom de vagas ou notícias — os itens das fontes ativas aparecem misturados ao resto do feed."
            : "Add RSS/Atom feeds of jobs or news — active sources' items are merged into the rest of the feed."}
        </p>

        <form onSubmit={handleAdd} className="mt-4 space-y-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <Label>{pt ? "URL do feed (https://…)" : "Feed URL (https://…)"}</Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com/feed.xml"
              required
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>{pt ? "Nome (opcional)" : "Label (optional)"}</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={pt ? "Minha fonte" : "My source"} />
            </div>
            <div className="w-32">
              <Label>{pt ? "Tipo" : "Type"}</Label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as CustomSourceKind)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-400"
              >
                <option value="news">{KIND_LABELS.news[pt ? "pt" : "en"]}</option>
                <option value="jobs">{KIND_LABELS.jobs[pt ? "pt" : "en"]}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary">
              {pt ? "Adicionar fonte" : "Add source"}
            </Button>
          </div>
        </form>

        <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
          {sources.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {pt ? "Nenhuma fonte adicionada ainda." : "No sources added yet."}
            </p>
          )}
          {sources.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              <input
                type="checkbox"
                checked={s.active}
                onChange={() => toggleSource(s.id)}
                aria-label={pt ? "Ativa" : "Active"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                  {s.label || s.url}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{s.url}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {KIND_LABELS[s.kind][pt ? "pt" : "en"]}
              </span>
              <Button type="button" variant="danger" onClick={() => removeSource(s.id)}>
                {pt ? "Remover" : "Remove"}
              </Button>
            </div>
          ))}
        </div>

        {feedStatus === "error" && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
            <p>
              {pt
                ? `Não foi possível carregar uma ou mais fontes (${feedErrorMessage ?? ""}).`
                : `Couldn't load one or more sources (${feedErrorMessage ?? ""}).`}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1.5 rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-200 dark:hover:bg-amber-950/50"
            >
              {pt ? "Tentar de novo" : "Try again"}
            </button>
          </div>
        )}
        {feedStatus === "loading" && sources.some((s) => s.active) && (
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            {pt ? "Carregando suas fontes…" : "Loading your sources…"}
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>
            {pt ? "Fechar" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
