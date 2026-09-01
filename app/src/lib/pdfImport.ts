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
  {
    type: "summary",
    keywords: [
      "resumo", "resumo profissional", "objetivo", "objetivo profissional", "perfil",
      "perfil profissional", "sobre mim", "sobre", "apresentacao", "quem sou eu",
      "summary", "professional summary", "profile", "professional profile",
      "objective", "career objective", "about me", "about",
    ],
  },
  {
    type: "experience",
    keywords: [
      "experiencia", "experiencia profissional", "experiencias profissionais",
      "historico profissional", "trajetoria profissional", "atuacao profissional",
      "vida profissional", "experience", "professional experience", "work experience",
      "employment history", "career history", "work history",
    ],
  },
  {
    type: "leadership",
    keywords: [
      "lideranca", "atividades de lideranca", "voluntariado", "trabalho voluntario",
      "atividades extracurriculares", "leadership", "leadership activities",
      "volunteer", "volunteer work", "extracurricular activities",
    ],
  },
  {
    type: "projects",
    keywords: [
      "projetos", "projetos pessoais", "portfolio", "projects", "personal projects",
      "portfolio projects", "side projects",
    ],
  },
  {
    type: "education",
    keywords: [
      "educacao", "formacao", "formacao academica", "formacao escolar", "escolaridade",
      "qualificacao academica", "education", "academic background", "academic education",
      "schooling", "educational background",
    ],
  },
  {
    type: "skills",
    keywords: [
      "habilidades", "habilidades tecnicas", "competencias", "conhecimentos",
      "conhecimentos tecnicos", "idiomas", "certificacoes", "certificados", "cursos",
      "skills", "technical skills", "core competencies", "languages", "certifications",
      "courses",
    ],
  },
];

type SectionType = "summary" | "experience" | "leadership" | "projects" | "education" | "skills";

function stripAccents(text: string): string {
  return text
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase();
}

/** Removes spaces — collapses letter-spaced headers like "E X P E R I Ê N C I A". */
function squash(text: string): string {
  return text.replace(/\s+/g, "");
}

function detectHeader(line: string): SectionType | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Strip icons, numbering ("1.", "02)"), bullets and punctuation, keep only letters/spaces.
  const clean = stripAccents(trimmed)
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return null;

  // Collapses letter-spaced headers like "E X P E R I Ê N C I A" into "experiencia".
  const squashed = squash(clean);
  const cleanWords = clean.split(" ");

  for (const section of SECTION_HEADERS) {
    for (const keyword of section.keywords) {
      const keywordWordCount = keyword.split(" ").length;

      if (clean === keyword) return section.type;
      if (clean.startsWith(keyword + " ")) {
        // Allow a couple of extra trailing words ("... e Acadêmica"), but reject
        // full sentences that merely happen to start with a keyword.
        const extraWords = cleanWords.length - keywordWordCount;
        if (extraWords <= 2 && cleanWords.length <= 6) return section.type;
      }

      const kSquash = squash(keyword);
      if (squashed === kSquash) return section.type;
      if (squashed.startsWith(kSquash) && squashed.length - kSquash.length <= 15) {
        return section.type;
      }
    }
  }
  return null;
}

function cleanBullet(line: string): string {
  return line.replace(/^[•\-*–▪●○]\s*/, "").trim();
}

/**
 * True only when the line is essentially just contact info (e.g. "email | phone | linkedin").
 * A content line that merely mentions a URL ("Project — github.com/x/y") must NOT match,
 * or its whole line would be silently dropped instead of kept as a bullet.
 */
function isMostlyContactLine(line: string, patterns: RegExp[]): boolean {
  let stripped = line;
  for (const re of patterns) {
    const match = stripped.match(re);
    if (match) stripped = stripped.replace(match[0], "");
  }
  stripped = stripped.replace(/[|•·,;:\-–]+/g, "").trim();
  return stripped.length <= 3;
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

  const contactPatterns = [EMAIL_RE, LINKEDIN_RE, GITHUB_RE, ...(phone ? [PHONE_RE] : [])];

  for (const line of allLines) {
    if (line === nameLine) continue;
    if (isMostlyContactLine(line, contactPatterns)) continue;

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
