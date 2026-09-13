export interface GithubRepo {
  id: number;
  name: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  language: string | null;
  fork: boolean;
  updatedAt: string;
}

interface GithubRepoApiResponse {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  updated_at: string;
  archived: boolean;
}

export class GithubImportError extends Error {
  constructor(public readonly reason: "not-found" | "rate-limited" | "network") {
    super(reason);
  }
}

/** Public, unauthenticated GitHub REST endpoint — no token, no backend of our own, so it's
 * subject to GitHub's anonymous rate limit (60 requests/hour per IP). Fine for a person looking
 * up their own repos a few times; GithubImportModal surfaces `rate-limited` distinctly so the
 * user understands why it failed rather than seeing a generic error. Forks are excluded by
 * default by the caller (kept here as data) since a fork rarely represents the user's own work. */
export async function fetchGithubRepos(username: string): Promise<GithubRepo[]> {
  const trimmed = username.trim().replace(/^@/, "");
  if (!trimmed) return [];

  let res: Response;
  try {
    res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(trimmed)}/repos?per_page=100&sort=updated`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
  } catch {
    throw new GithubImportError("network");
  }

  if (res.status === 404) throw new GithubImportError("not-found");
  if (res.status === 403 || res.status === 429) throw new GithubImportError("rate-limited");
  if (!res.ok) throw new GithubImportError("network");

  const data = (await res.json()) as GithubRepoApiResponse[];
  return data
    .filter((r) => !r.archived)
    .map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      htmlUrl: r.html_url,
      stars: r.stargazers_count,
      language: r.language,
      fork: r.fork,
      updatedAt: r.updated_at,
    }))
    .sort((a, b) => b.stars - a.stars || +new Date(b.updatedAt) - +new Date(a.updatedAt));
}
