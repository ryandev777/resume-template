import type { ResumeData } from "./types";

const PDF_WORKER_VERSION = "6.3.289";

export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_WORKER_VERSION}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let currentLine = "";

    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = item.str;
      } else {
        currentLine += item.str;
      }
      lastY = y;
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
  }

  return lines.join("\n");
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,;)]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s,;)]+/i;

const SECTION_HEADERS: { type: SectionType; keywords: string[] }[] = [
  { type: "summary", keywords: ["resumo", "objetivo", "perfil profissional", "sobre mim", "summary", "profile", "objective", "about me"] },
  { type: "experience", keywords: ["experiencia profissional", "experiencia", "experience", "work experience", "professional experience", "employment history"] },
  { type: "leadership", keywords: ["lideranca", "atividades de lideranca", "leadership", "leadership activities", "voluntariado", "volunteer"] },
  { type: "projects", keywords: ["projetos", "projects"] },
  { type: "education", keywords: ["educacao", "formacao", "formacao academica", "education", "academic background"] },
  { type: "skills", keywords: ["habilidades", "competencias", "skills", "technical skills", "idiomas", "languages"] },
];

type SectionType = "summary" | "experience" | "leadership" | "projects" | "education" | "skills";

function stripAccents(text: string): string {
  return text
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase();
}

function detectHeader(line: string): SectionType | null {
  const clean = stripAccents(line.trim()).replace(/[:.]+$/, "");
  if (!clean || clean.split(/\s+/).length > 5) return null;
  for (const section of SECTION_HEADERS) {
    if (section.keywords.some((k) => clean === k || clean.startsWith(k))) {
      return section.type;
    }
  }
  return null;
}

function cleanBullet(line: string): string {
  return line.replace(/^[•\-*–▪●○]\s*/, "").trim();
}

export interface PdfImportResult {
  data: Partial<ResumeData>;
  rawText: string;
}

export function parseResumeText(rawText: string): Partial<ResumeData> {
  const allLines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const email = rawText.match(EMAIL_RE)?.[0] ?? "";
  const phone = rawText.match(PHONE_RE)?.[0] ?? "";
  const linkedin = rawText.match(LINKEDIN_RE)?.[0] ?? "";
  const github = rawText.match(GITHUB_RE)?.[0] ?? "";

  const nameLine = allLines.find(
    (l) =>
      !EMAIL_RE.test(l) &&
      !LINKEDIN_RE.test(l) &&
      !GITHUB_RE.test(l) &&
      l.split(/\s+/).length <= 6 &&
      l.split(/\s+/).length >= 2 &&
      !/\d{3,}/.test(l),
  );

  const sections: { type: SectionType; lines: string[] }[] = [];
  let current: { type: SectionType; lines: string[] } | null = null;
  const preamble: string[] = [];

  for (const line of allLines) {
    if (line === nameLine) continue;
    if (
      EMAIL_RE.test(line) ||
      LINKEDIN_RE.test(line) ||
      GITHUB_RE.test(line) ||
      (phone && PHONE_RE.test(line))
    )
      continue;

    const header = detectHeader(line);
    if (header) {
      current = { type: header, lines: [] };
      sections.push(current);
      continue;
    }
    if (current) {
      current.lines.push(cleanBullet(line));
    } else {
      preamble.push(line);
    }
  }

  function joinSection(type: SectionType): string[] {
    return sections.filter((s) => s.type === type).flatMap((s) => s.lines);
  }

  const summaryLines = [...preamble, ...joinSection("summary")];
  const experienceLines = joinSection("experience");
  const leadershipLines = joinSection("leadership");
  const projectLines = joinSection("projects");
  const educationLines = joinSection("education");
  const skillsLines = joinSection("skills");

  const data: Partial<ResumeData> = {
    personal: {
      fullName: nameLine ?? "",
      location: "",
      email,
      phone,
      linkedin,
      github,
      website: "",
    },
    summary: summaryLines.join(" ").slice(0, 600),
  };

  if (experienceLines.length > 0) {
    data.experiences = [
      {
        id: "",
        org: "",
        location: "",
        role: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: experienceLines,
      },
    ];
  }

  if (leadershipLines.length > 0) {
    data.leadership = [
      {
        id: "",
        org: "",
        location: "",
        role: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: leadershipLines,
      },
    ];
  }

  if (educationLines.length > 0) {
    data.education = [
      {
        id: "",
        institution: "",
        location: "",
        degree: educationLines.join(" ").slice(0, 300),
        startDate: "",
        endDate: "",
      },
    ];
  }

  if (projectLines.length > 0) {
    data.projects = [
      { id: "", name: "", link: "", description: projectLines.join(" ").slice(0, 400) },
    ];
  }

  if (skillsLines.length > 0) {
    data.skills = { technical: skillsLines.join(", "), languages: "" };
  }

  return data;
}
