import type { ResumeData } from "./types";

/** Plain-text rendering of the resume — no markup, no styling, just labeled lines separated by
 * blank lines. Meant for pasting into an ATS text field that rejects PDFs/rich text, not as a
 * replacement for the PDF export. */
export function resumeToPlainText(data: ResumeData): string {
  const pt = data.locale === "pt-br";
  const lines: string[] = [];

  const name = data.personal.fullName || (pt ? "Nome Completo" : "Full Name");
  lines.push(name.toUpperCase());
  if (data.personal.headline) lines.push(data.personal.headline);

  const contact = [
    data.personal.location,
    data.personal.email,
    data.personal.phone,
    data.personal.linkedin,
    data.personal.github,
    data.personal.website,
  ].filter(Boolean);
  if (contact.length > 0) lines.push(contact.join(" | "));

  const educationBlock = data.education.filter((e) => e.institution.trim());
  const addEducation = () => {
    if (educationBlock.length === 0) return;
    lines.push("", pt ? "EDUCAÇÃO" : "EDUCATION");
    for (const e of educationBlock) {
      lines.push(`${e.institution}${e.location ? " — " + e.location : ""}`);
      const period = [e.startDate, e.endDate].filter(Boolean).join(" – ");
      lines.push([e.degree, period].filter(Boolean).join(" | "));
    }
  };

  if (data.summary) {
    lines.push("", pt ? "RESUMO" : "SUMMARY", data.summary);
  }

  if (data.studentMode) addEducation();

  const experiences = data.experiences.filter((e) => e.org.trim());
  if (experiences.length > 0) {
    lines.push("", pt ? "EXPERIÊNCIA" : "EXPERIENCE");
    for (const e of experiences) {
      lines.push(`${e.org}${e.location ? " — " + e.location : ""}`);
      const period = [e.startDate, e.endDate].filter(Boolean).join(" – ");
      lines.push([e.role, period].filter(Boolean).join(" | "));
      for (const b of e.bullets.filter(Boolean)) lines.push(`- ${b}`);
    }
  }

  const leadership = data.leadership.filter((e) => e.org.trim());
  if (leadership.length > 0) {
    lines.push("", pt ? "LIDERANÇA" : "LEADERSHIP");
    for (const e of leadership) {
      lines.push(`${e.org}${e.location ? " — " + e.location : ""}`);
      const period = [e.startDate, e.endDate].filter(Boolean).join(" – ");
      lines.push([e.role, period].filter(Boolean).join(" | "));
      for (const b of e.bullets.filter(Boolean)) lines.push(`- ${b}`);
    }
  }

  const projects = data.projects.filter((p) => p.name.trim());
  if (projects.length > 0) {
    lines.push("", pt ? "PROJETOS" : "PROJECTS");
    for (const p of projects) {
      lines.push([p.name, p.link].filter(Boolean).join(" — "));
      if (p.description) lines.push(p.description);
    }
  }

  if (data.skills.technical || data.skills.languages) {
    lines.push("", pt ? "HABILIDADES" : "SKILLS");
    if (data.skills.technical) {
      lines.push(`${pt ? "Técnicas" : "Technical"}: ${data.skills.technical}`);
    }
    if (data.skills.languages) {
      lines.push(`${pt ? "Idiomas" : "Languages"}: ${data.skills.languages}`);
    }
  }

  if (!data.studentMode) addEducation();

  return lines.join("\n").trim() + "\n";
}
