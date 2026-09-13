import type { ResumeData } from "./types";

/** Pulls a short "why I'm a fit" line out of the most recent experience entry, if there is one —
 * just its role + org, not the bullets (those are too granular for an opening paragraph). */
function latestRoleLine(data: ResumeData, pt: boolean): string | null {
  const entry = data.experiences.find((e) => e.org.trim() && e.role.trim());
  if (!entry) return null;
  return pt ? `atuando como ${entry.role} na ${entry.org}` : `working as ${entry.role} at ${entry.org}`;
}

/** Builds a short, editable cover-letter draft from the résumé data already in the store plus a
 * pasted job description — a starting point to rewrite, not a finished letter. Deliberately does
 * NOT stuff in the job's keyword list (see JobMatchPanel's own note on that) — it only pulls a
 * company name guess out of the job text when one is obviously present. */
export function generateCoverLetter(
  data: ResumeData,
  jobDescription: string,
  companyNameHint: string | undefined,
  locale: ResumeData["locale"],
): string {
  const pt = locale === "pt-br";
  const name = data.personal.fullName || (pt ? "[Seu nome]" : "[Your name]");
  const headline = data.personal.headline;
  const roleLine = latestRoleLine(data, pt);
  const company = companyNameHint?.trim() || (pt ? "[nome da empresa]" : "[company name]");
  const skillsList = data.skills.technical.trim();

  if (pt) {
    return [
      `Prezados(as) da ${company},`,
      "",
      `Me chamo ${name}${headline ? `, ${headline}` : ""}, e tenho interesse na vaga divulgada${
        jobDescription.trim() ? " por vocês" : ""
      }.${roleLine ? ` Atualmente ${roleLine}.` : ""}`,
      "",
      data.summary.trim()
        ? data.summary.trim()
        : "[Descreva em 2-3 frases sua experiência mais relevante para essa vaga.]",
      skillsList
        ? `Entre as tecnologias com as quais trabalho estão: ${skillsList}.`
        : "[Cite as tecnologias/habilidades mais relevantes para essa vaga.]",
      "",
      "Fico à disposição para conversarmos sobre como minha experiência pode contribuir com o time. Agradeço desde já pela atenção.",
      "",
      "Atenciosamente,",
      name,
    ].join("\n");
  }

  return [
    `Dear ${company} team,`,
    "",
    `My name is ${name}${headline ? `, ${headline}` : ""}, and I'm interested in the role you posted${
      jobDescription.trim() ? "" : ""
    }.${roleLine ? ` I'm currently ${roleLine}.` : ""}`,
    "",
    data.summary.trim()
      ? data.summary.trim()
      : "[Describe in 2-3 sentences your most relevant experience for this role.]",
    skillsList
      ? `Some of the technologies I work with include: ${skillsList}.`
      : "[Mention the skills/technologies most relevant to this role.]",
    "",
    "I'd welcome the chance to talk about how my experience could contribute to the team. Thank you for your time and consideration.",
    "",
    "Best regards,",
    name,
  ].join("\n");
}
