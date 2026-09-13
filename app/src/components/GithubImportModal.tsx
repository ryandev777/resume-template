"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui";
import { fetchGithubRepos, GithubImportError, type GithubRepo } from "@/lib/githubImport";
import type { Locale, ProjectEntry } from "@/lib/types";

/** Same modal shell as ShareModal/ProfilesModal. Looks up a GitHub username's public repos
 * (unauthenticated REST API — no token, no backend) and lets the user pick which ones become
 * new project entries. Purely additive: it only ever appends via importProjects, never touches
 * or removes existing project entries. */
export function GithubImportModal({
  locale,
  existingLinks,
  onClose,
  onImport,
}: {
  locale: Locale;
  /** Links already present in the résumé's projects, so repos already imported can be flagged
   * instead of silently offered again. */
  existingLinks: string[];
  onClose: () => void;
  onImport: (entries: Omit<ProjectEntry, "id">[]) => void;
}) {
  const pt = locale === "pt-br";
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[] | null>(null);
  const [includeForks, setIncludeForks] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const visibleRepos = repos?.filter((r) => includeForks || !r.fork) ?? [];
  const alreadyImported = new Set(existingLinks);

  async function handleSearch() {
    if (!username.trim()) return;
    setLoading(true);
    setRepos(null);
    setSelected(new Set());
    try {
      const result = await fetchGithubRepos(username);
      setRepos(result);
      if (result.length === 0) {
        toast.error(
          pt ? "Esse usuário não tem repositórios públicos." : "That user has no public repositories.",
        );
      }
    } catch (err) {
      const reason = err instanceof GithubImportError ? err.reason : "network";
      toast.error(
        reason === "not-found"
          ? pt
            ? "Usuário do GitHub não encontrado."
            : "GitHub user not found."
          : reason === "rate-limited"
            ? pt
              ? "Limite de requisições anônimas do GitHub atingido — tente de novo em alguns minutos."
              : "GitHub's anonymous rate limit was hit — try again in a few minutes."
            : pt
              ? "Não foi possível buscar os repositórios agora."
              : "Couldn't fetch repositories right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleImport() {
    const chosen = visibleRepos.filter((r) => selected.has(r.id));
    if (chosen.length === 0) return;
    onImport(
      chosen.map((r) => ({
        name: r.name,
        link: r.htmlUrl,
        description: r.description ?? "",
      })),
    );
    toast.success(
      pt
        ? `${chosen.length} projeto(s) importado(s) do GitHub.`
        : `${chosen.length} project(s) imported from GitHub.`,
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {pt ? "Importar projetos do GitHub" : "Import projects from GitHub"}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {pt
            ? "Busca os repositórios públicos do usuário direto na API do GitHub — nada passa por servidor nosso. Escolha quais viram projetos no currículo."
            : "Looks up the user's public repos straight from GitHub's API — nothing passes through our servers. Pick which ones become projects on your resume."}
        </p>

        <div className="mt-4 flex gap-2">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={pt ? "usuário do GitHub" : "GitHub username"}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <Button type="button" variant="secondary" disabled={loading || !username.trim()} onClick={handleSearch}>
            {loading ? (pt ? "Buscando…" : "Searching…") : pt ? "Buscar" : "Search"}
          </Button>
        </div>

        {repos && repos.length > 0 && (
          <label className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={includeForks}
              onChange={(e) => setIncludeForks(e.target.checked)}
            />
            {pt ? "Incluir forks" : "Include forks"}
          </label>
        )}

        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
          {visibleRepos.map((r) => {
            const imported = alreadyImported.has(r.htmlUrl);
            return (
              <label
                key={r.id}
                className={
                  "flex items-start gap-2 rounded-md border border-slate-200 p-2 text-sm dark:border-slate-700 " +
                  (imported ? "opacity-50" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800")
                }
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  disabled={imported}
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>
                    {r.stars > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">★ {r.stars}</span>
                    )}
                    {r.language && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">· {r.language}</span>
                    )}
                    {imported && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">
                        {pt ? "já importado" : "already imported"}
                      </span>
                    )}
                  </span>
                  {r.description && (
                    <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                      {r.description}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
          {repos && visibleRepos.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {pt ? "Nenhum repositório para mostrar." : "No repositories to show."}
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            {pt ? "Fechar" : "Close"}
          </Button>
          <Button type="button" disabled={selected.size === 0} onClick={handleImport}>
            {pt ? `Importar selecionados (${selected.size})` : `Import selected (${selected.size})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
