/**
 * Companies whose public ATS job boards feed fetchAtsJobs() in feed.ts (Fase P').
 *
 * Both platforms expose a no-key, CORS-open JSON endpoint meant for embedding jobs on a
 * company site — confirmed live before adding any slug here:
 *   Greenhouse: https://boards-api.greenhouse.io/v1/boards/<slug>/jobs
 *   Lever:      https://api.lever.co/v0/postings/<slug>?mode=json
 *
 * Greenhouse slugs below are Brazilian companies (job board includes `company_name`, so no
 * separate display name is needed). Lever slugs are remote-first companies checked to have at
 * least some `workplaceType: "remote"` postings — feed.ts still filters those further to ones
 * whose location text is Brazil- or globally-remote-relevant (see classifyAtsLocation),
 * dropping e.g. "US-Based only" postings. Lever's API doesn't return a company display name, so
 * `name` is required there.
 *
 * Slugs tried and rejected (404, i.e. don't use that platform or use a different slug):
 * loft-tech, creditas, mercadolivre, wellhub, ifood, doordash, zendesk, docusign, netflix,
 * rappi, loggi, hotmart, supabase, github, plaid, remote (as a company), and several more —
 * spot-checked, not exhaustive; a slug not listed here simply hasn't been validated yet.
 */

export interface AtsCompany {
  slug: string;
  platform: "greenhouse" | "lever";
  /** Required for Lever (its API has no company display name field). Ignored for Greenhouse,
   * which returns `company_name` per job. */
  name?: string;
}

export const ATS_COMPANIES: AtsCompany[] = [
  { slug: "nubank", platform: "greenhouse" },
  { slug: "quintoandar", platform: "greenhouse" },
  { slug: "gympass", platform: "greenhouse" },
  { slug: "ebanx", platform: "greenhouse" },
  { slug: "vtex", platform: "greenhouse" },
  { slug: "stone", platform: "greenhouse" },
  { slug: "wildlifestudios", platform: "greenhouse" },
  { slug: "toptal", platform: "lever", name: "Toptal" },
];
