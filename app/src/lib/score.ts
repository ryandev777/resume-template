import type { Locale, ResumeData } from "./types";

export interface CheckItem {
  id: string;
  label: string;
  hint: string;
  passed: boolean;
}

const HAS_DIGIT = /\d/;

export function computeChecklist(data: ResumeData, locale: Locale): CheckItem[] {
  const experiences = data.experiences.filter((e) => e.org.trim());
  const allBullets = [
    ...experiences.flatMap((e) => e.bullets),
    ...data.leadership.flatMap((e) => e.bullets),
  ].filter((b) => b.trim());
  const quantified = allBullets.filter((b) => HAS_DIGIT.test(b));
  const quantifiedRatio = allBullets.length > 0 ? quantified.length / allBullets.length : 0;

  const pt = locale === "pt-br";

  return [
    {
      id: "name",
      label: pt ? "Nome e contato preenchidos" : "Name and contact filled in",
      hint: pt
        ? "Nome completo e e-mail são o mínimo para um recrutador te encontrar."
        : "Full name and email are the minimum for a recruiter to reach you.",
      passed: data.personal.fullName.trim().length > 0 && data.personal.email.trim().includes("@"),
    },
    {
      id: "summary",
      label: pt ? "Tem um resumo profissional" : "Has a professional summary",
      hint: pt
        ? "2-3 linhas no topo ajudam quem lê (humano ou ATS) a entender seu perfil rápido."
        : "2-3 lines at the top help the reader (human or ATS) understand your profile fast.",
      passed: data.summary.trim().length >= 40,
    },
    {
      id: "experience",
      label: pt ? "Pelo menos uma experiência preenchida" : "At least one experience filled in",
      hint: pt
        ? "Vaga, estágio, projeto acadêmico ou trabalho voluntário também contam."
        : "A job, internship, academic project or volunteer work all count.",
      passed: experiences.length > 0,
    },
    {
      id: "quantified",
      label: pt
        ? `Realizações com números (${Math.round(quantifiedRatio * 100)}%)`
        : `Achievements with numbers (${Math.round(quantifiedRatio * 100)}%)`,
      hint: pt
        ? "Recrutadores (inclusive do Google) buscam resultado mensurável, não só a tarefa feita."
        : "Recruiters (Google included) look for measurable results, not just the task performed.",
      passed: allBullets.length > 0 && quantifiedRatio >= 0.3,
    },
    {
      id: "skills",
      label: pt ? "Habilidades técnicas preenchidas" : "Technical skills filled in",
      hint: pt
        ? "É o campo mais escaneado por sistemas de ATS em busca de palavras-chave."
        : "This is the field ATS systems scan the most for keywords.",
      passed: data.skills.technical.trim().length > 0,
    },
    {
      id: "education",
      label: pt ? "Educação preenchida" : "Education filled in",
      hint: pt
        ? "Mesmo cursos incompletos ou em andamento valem a pena informar."
        : "Even incomplete or in-progress degrees are worth listing.",
      passed: data.education.some((e) => e.institution.trim()),
    },
  ];
}
