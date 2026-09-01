import type { Locale, ResumeData } from "./types";

const STOPWORDS_PT = new Set(
  `a ao aos as com como da das de dela dele deles depois do dos e ela elas ele eles em entre essa essas
  esse esses esta estas este estes eu foi for foram fosse isso isto ja lhe lhes mais mas me mesmo meu
  meus minha minhas muito na nao nas nem no nos nossa nossas nosso nossos num numa o os ou para pela
  pelas pelo pelos por qual quando que quem se sem seu seus so sua suas tambem te tem tera teu teus
  teve tinha tua tuas tudo um uma umas uns vai vao vc voce voces ate outro outra outros outras onde
  cada qualquer todo toda todos todas ser sao sido sendo tem tinham havia houve ha anos ano meses mes
  dias dia empresa vaga vagas atividades responsavel funcao area experiencia conhecimento
  conhecimentos desejavel diferencial requisitos beneficios oferecemos buscamos procuramos`
    .split(/\s+/)
    .filter(Boolean),
);

const STOPWORDS_EN = new Set(
  `a an and are as at be by for from has have if in into is it its of on or our that the their this to
  was were will with you your we they i he she job role company team years experience skills
  requirements responsibilities benefits looking seeking must should nice great etc within across
  including including such other others all any about into per each ability strong excellent`
    .split(/\s+/)
    .filter(Boolean),
);

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(text: string): string {
  return text.normalize("NFD").replace(DIACRITICS_RE, "").toLowerCase();
}

function tokenize(text: string): string[] {
  const matches = normalize(text).match(/[a-z0-9+#.]{2,}/g) ?? [];
  return matches.map((t) => t.replace(/\.+$/, "")).filter((t) => t.length >= 2);
}

export interface KeywordResult {
  word: string;
  count: number;
  matched: boolean;
}

export function extractTopKeywords(
  jobDescription: string,
  locale: Locale,
  limit = 25,
): { word: string; count: number }[] {
  const stopwords = locale === "pt-br" ? STOPWORDS_PT : STOPWORDS_EN;
  const tokens = tokenize(jobDescription).filter(
    (t) => t.length >= 3 && !stopwords.has(t) && !/^\d+$/.test(t),
  );

  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

export function buildResumeText(data: ResumeData): string {
  const parts: string[] = [
    data.summary,
    data.skills.technical,
    data.skills.languages,
    ...data.experiences.flatMap((e) => [e.role, e.org, ...e.bullets]),
    ...data.leadership.flatMap((e) => [e.role, e.org, ...e.bullets]),
    ...data.education.map((e) => e.degree),
    ...data.projects.flatMap((p) => [p.name, p.description]),
  ];
  return normalize(parts.filter(Boolean).join(" "));
}

export function matchKeywords(
  jobDescription: string,
  data: ResumeData,
  locale: Locale,
): KeywordResult[] {
  const resumeText = buildResumeText(data);
  const resumeTokens = new Set(tokenize(resumeText));

  return extractTopKeywords(jobDescription, locale).map(({ word, count }) => ({
    word,
    count,
    matched: resumeTokens.has(word),
  }));
}
