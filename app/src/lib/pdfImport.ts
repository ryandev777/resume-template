import type { EducationEntry, Entry, ResumeData } from "./types";

/**
 * Extracts text from a PDF, one line per string, joined by "\n". A blank line ("")
 * is inserted wherever the vertical gap between two lines is noticeably larger than
 * the page's typical line spacing — this marks a paragraph/entry boundary (e.g. between
 * two jobs, or two projects) so parseResumeText can split a section into multiple entries
 * instead of dumping everything into one.
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  // Self-hosted (public/pdf.worker.min.mjs, kept in sync by scripts/copy-pdf-worker.mjs on
  // postinstall) instead of a CDN — some networks (corporate proxies, privacy extensions,
  // sandboxed browser portals) silently block cross-origin CDN scripts, which used to make
  // PDF import hang with no visible error.
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const output: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const pageLines: { text: string; y: number }[] = [];
    let lastY: number | null = null;
    let currentLine = "";
    let currentLineY = 0;

    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (currentLine.trim()) pageLines.push({ text: currentLine.trim(), y: currentLineY });
        currentLine = item.str;
        currentLineY = y;
      } else {
        currentLine += item.str;
        if (!currentLine.trim()) currentLineY = y;
      }
      lastY = y;
    }
    if (currentLine.trim()) pageLines.push({ text: currentLine.trim(), y: currentLineY });

    const gaps = pageLines
      .slice(1)
      .map((line, i) => pageLines[i].y - line.y)
      .filter((g) => g > 0);
    const typicalGap = gaps.length > 0 ? gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 0;

    if (i > 1) output.push("");
    pageLines.forEach((line, idx) => {
      if (idx > 0 && typicalGap > 0) {
        const gap = pageLines[idx - 1].y - line.y;
        if (gap > typicalGap * 1.6) output.push("");
      }
      output.push(line.text);
    });
  }

  return output.join("\n");
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,;)]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s,;)]+/i;
/** Matches a "City, ST" style location fragment (e.g. "Fortaleza, CE" or "Cambridge, MA"). */
const LOCATION_RE = /\p{Lu}[\p{L}.'-]*(?:\s+\p{Lu}[\p{L}.'-]*)*,\s*\p{Lu}{2}\b/u;

const MONTH_NAMES =
  "jan(?:eiro)?|fev(?:ereiro)?|mar(?:ço|co)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?|" +
  "january|february|march|april|may|june|july|august|september|october|november|december";
const CURRENT_WORDS = "atual|presente|current|present|now|hoje|em andamento";
const DATE_TOKEN = `(?:\\d{1,2}[\\/.]\\d{4}|(?:${MONTH_NAMES})\\.?\\s*(?:de\\s*)?\\d{4}|\\d{4})`;
const DATE_RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:-|–|—|a|to|até)\\s*(${DATE_TOKEN}|${CURRENT_WORDS})`,
  "i",
);
const CURRENT_WORD_RE = new RegExp(`^(?:${CURRENT_WORDS})$`, "i");

/**
 * Finds a "start – end" date range in a line (handles numeric, month-name and "Atual/Present"
 * end tokens) and strips it out, returning the residual text plus the parsed dates. When no
 * range is found, the line is returned unchanged with empty dates.
 */
function extractDateRange(line: string): {
  text: string;
  startDate: string;
  endDate: string;
  current: boolean;
} {
  const match = line.match(DATE_RANGE_RE);
  if (!match || match.index === undefined) {
    return { text: line, startDate: "", endDate: "", current: false };
  }
  const start = match[1].trim();
  const endRaw = match[2].trim();
  const isCurrent = CURRENT_WORD_RE.test(endRaw);
  const text = (line.slice(0, match.index) + line.slice(match.index + match[0].length))
    .replace(/^[\s|,\-–—]+/, "")
    .replace(/[\s|,\-–—]+$/, "")
    .trim();
  return { text, startDate: start, endDate: isCurrent ? "" : endRaw, current: isCurrent };
}

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

const BULLET_MARKER_RE = /^[•\-*–▪●○]\s*/;

function cleanBullet(line: string): string {
  return line.replace(BULLET_MARKER_RE, "").trim();
}

/**
 * Re-joins a run of physical PDF lines that are really one wrapped bullet (e.g. a long
 * achievement sentence that spans 3-4 lines) back into a single bullet. A line is treated as
 * a continuation — not a new bullet — when the previous line doesn't end in sentence-final
 * punctuation (. ! ?) AND the line itself doesn't start with a bullet marker (•, -, *, ...).
 * Must run on lines that still carry their original marker (before cleanBullet strips it),
 * since that marker is the signal that a line is a genuinely new bullet.
 */
function mergeWrappedLines(lines: string[]): string[] {
  const merged: string[] = [];
  for (const raw of lines) {
    if (raw === "") {
      merged.push(raw);
      continue;
    }
    const hasMarker = BULLET_MARKER_RE.test(raw);
    const prev = merged.length > 0 ? merged[merged.length - 1] : "";
    const prevEndsSentence = prev !== "" && /[.!?]$/.test(prev.trim());
    if (prev !== "" && !hasMarker && !prevEndsSentence) {
      merged[merged.length - 1] = `${prev} ${raw.trim()}`;
    } else {
      merged.push(raw);
    }
  }
  return merged.map(cleanBullet).filter((l) => l !== "");
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

/** Truncates at the last full word instead of cutting mid-word, appending an ellipsis. */
function truncateAtWord(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const safe = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return safe.trim() + "…";
}

/** Splits a section's lines back into paragraph groups using the "" boundary markers. */
function splitIntoGroups(lines: string[]): string[][] {
  const groups: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line === "") {
      if (current.length > 0) {
        groups.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

function looksLikeHeaderLine(line: string): boolean {
  return line.includes(" | ") || line.split(/\s+/).length <= 8;
}

/**
 * Pairs a header-only paragraph (a short line, e.g. a company or project name) with the
 * paragraph right after it (its description/bullets). A short line NOT followed by a body
 * paragraph is kept as its own header-only item. This only works well for sections shaped
 * like "name, then one descriptive block" (projects) — job bullet lists are too irregular
 * in spacing for this to reliably tell "new bullet" from "wrapped continuation line", so
 * experience/leadership stay as one entry with every line kept as its own bullet.
 */
function mergeHeaderGroups(groups: string[][]): { header: string; body: string[] }[] {
  const merged: { header: string; body: string[] }[] = [];
  let i = 0;
  while (i < groups.length) {
    const group = groups[i];
    const isHeaderOnly = group.length === 1 && looksLikeHeaderLine(group[0]);
    if (isHeaderOnly && groups[i + 1]) {
      merged.push({ header: group[0], body: groups[i + 1] });
      i += 2;
    } else if (isHeaderOnly) {
      merged.push({ header: group[0], body: [] });
      i += 1;
    } else {
      merged.push({ header: "", body: group });
      i += 1;
    }
  }
  return merged;
}

/**
 * A short, title-like line (company/role, not a full sentence) — the kind of line used as
 * a header before a job's bullets, as opposed to an achievement bullet (usually a longer
 * sentence ending in punctuation).
 */
function looksLikeShortHeader(line: string): boolean {
  // Lines are collected raw (marker + all — see the section-collection loop below) so
  // mergeWrappedLines can tell a new bullet from a wrapped continuation. Header/date
  // classification doesn't care about that marker and must strip it first, or a bulleted
  // date/header line (some PDFs bullet every header line: "• Empresa | Cidade") fails
  // every check here and gets misread as a bullet instead of a header.
  const trimmed = cleanBullet(line);
  if (!trimmed) return false;
  const words = trimmed.split(/\s+/).length;
  if (trimmed.includes(" | ")) return words <= 14;
  return words <= 8 && !/[.!?]$/.test(trimmed);
}

interface EntryHeaderBlock {
  headerLines: string[];
  bullets: string[];
}

/** A line that, once its date range is stripped out, has nothing left — e.g. "01/2022 - Atual". */
function isDateOnlyLine(line: string): boolean {
  const { text, startDate, endDate, current } = extractDateRange(cleanBullet(line));
  return (Boolean(startDate) || Boolean(endDate) || current) && text.length === 0;
}

/** Collects up to 3 header lines from the start of a group: org/location, role, then an
 * optional trailing date-only line (some resumes put dates on their own line under the role). */
function takeHeaderLines(group: string[]): { headerLines: string[]; rest: string[] } {
  const headerLines: string[] = [];
  let idx = 0;
  if (group[idx] && looksLikeShortHeader(group[idx])) {
    headerLines.push(group[idx]);
    idx += 1;
  }
  if (group[idx] && looksLikeShortHeader(group[idx])) {
    headerLines.push(group[idx]);
    idx += 1;
  }
  if (group[idx] && isDateOnlyLine(group[idx])) {
    headerLines.push(group[idx]);
    idx += 1;
  }
  return { headerLines, rest: group.slice(idx) };
}

/**
 * Splits a section's paragraph groups into per-entry blocks: a short header (org/location,
 * role, optionally a standalone date line) followed by its bullets. Mirrors mergeHeaderGroups
 * but allows a multi-line header, which is the shape experience/leadership sections use.
 * A group whose first line isn't header-like is kept as headerless bullets (old behavior),
 * so buildEntries can fall back cleanly when no headers were recognized at all.
 */
function splitEntryGroups(groups: string[][]): EntryHeaderBlock[] {
  const blocks: EntryHeaderBlock[] = [];
  let i = 0;
  while (i < groups.length) {
    const group = groups[i];
    const isHeaderOnlyGroup =
      group.length > 0 &&
      group.length <= 3 &&
      group.every((l) => looksLikeShortHeader(l) || isDateOnlyLine(l));
    if (isHeaderOnlyGroup && groups[i + 1]) {
      blocks.push({ headerLines: group, bullets: groups[i + 1] });
      i += 2;
      continue;
    }
    if (group.length > 0 && looksLikeShortHeader(group[0])) {
      const { headerLines, rest } = takeHeaderLines(group);
      blocks.push({ headerLines, bullets: rest });
      i += 1;
      continue;
    }
    blocks.push({ headerLines: [], bullets: group });
    i += 1;
  }
  return blocks;
}

function parseEntryHeader(headerLines: string[]): {
  org: string;
  location: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
} {
  let org = "";
  let location = "";
  let role = "";
  let startDate = "";
  let endDate = "";
  let current = false;
  const textLines: string[] = [];

  for (const rawLine of headerLines) {
    const parsed = extractDateRange(cleanBullet(rawLine));
    if (!startDate && !endDate && !current && (parsed.startDate || parsed.endDate || parsed.current)) {
      startDate = parsed.startDate;
      endDate = parsed.endDate;
      current = parsed.current;
    }
    if (parsed.text) textLines.push(parsed.text);
  }

  if (textLines[0]) {
    const parts = textLines[0].split(" | ").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      org = parts[0];
      location = parts[1];
    } else {
      org = textLines[0];
    }
  }

  if (textLines[1]) role = textLines[1];

  return { org, location, role, startDate, endDate, current };
}

/**
 * Builds one Entry per job/activity when headers can be identified (see splitEntryGroups),
 * so a section with two jobs produces two cards instead of one with everything flattened.
 * Falls back to the pre-existing behavior — a single entry with every line as a bullet —
 * when no header was recognized anywhere in the section, since guessing wrong there would
 * silently drop content instead of just leaving org/role blank.
 */
function buildEntries(groups: string[][]): Entry[] {
  const blocks = splitEntryGroups(groups);
  const anyHeaderFound = blocks.some((b) => b.headerLines.length > 0);

  if (!anyHeaderFound) {
    return [
      {
        id: "",
        org: "",
        location: "",
        role: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: groups.flatMap(mergeWrappedLines),
      },
    ];
  }

  return blocks.map((block) => {
    const { org, location, role, startDate, endDate, current } = parseEntryHeader(block.headerLines);
    return { id: "", org, location, role, startDate, endDate, current, bullets: mergeWrappedLines(block.bullets) };
  });
}

function buildEducationEntry(group: string[]): EducationEntry {
  const raw = group.map(cleanBullet).join(" ");
  const { text, startDate, endDate } = extractDateRange(raw);
  const pipeIndex = text.indexOf(" | ");
  if (pipeIndex > -1) {
    return {
      id: "",
      institution: text.slice(pipeIndex + 3).trim(),
      location: "",
      degree: truncateAtWord(text.slice(0, pipeIndex).trim(), 200),
      startDate,
      endDate,
    };
  }
  return {
    id: "",
    institution: "",
    location: "",
    degree: truncateAtWord(text, 300),
    startDate,
    endDate,
  };
}

/**
 * Joins skills lines with "; " between categories (e.g. "Frontend: React, Next.js") instead
 * of flattening everything with ", ", which used to erase the category labels. Lines without
 * a "Label: ..." shape are treated as one flat, uncategorized bucket and appended last.
 */
const SKILL_CATEGORY_RE = /^[\p{L}0-9 /&+.-]{2,40}:\s*.+/u;

function buildSkillsText(groups: string[][]): string {
  const lines = groups.flat().map(cleanBullet);
  const segments: string[] = [];
  const plain: string[] = [];
  for (const line of lines) {
    if (SKILL_CATEGORY_RE.test(line)) {
      segments.push(line.trim());
    } else {
      plain.push(line.trim());
    }
  }
  if (plain.length > 0) segments.push(plain.join(", "));
  return segments.join("; ");
}

/**
 * Keeps a trailing "Stack: X, Y, Z" line (or "Tecnologias:"/"Tech stack:") on its own line
 * inside the description instead of merging it into the running prose with a space.
 */
const STACK_LINE_RE = /^(stack|tecnologias?|tech stack|ferramentas)\s*:/i;

function buildProjectDescription(body: string[]): string {
  const prose: string[] = [];
  const stackLines: string[] = [];
  for (const raw of body) {
    const line = cleanBullet(raw);
    if (STACK_LINE_RE.test(line.trim())) {
      stackLines.push(line.trim());
    } else {
      prose.push(line);
    }
  }
  const combined = [prose.join(" ").trim(), ...stackLines].filter(Boolean).join("\n");
  return truncateAtWord(combined, 500);
}


export function parseResumeText(rawText: string): Partial<ResumeData> {
  // Blank lines ("") are preserved — they mark paragraph/entry boundaries produced by
  // extractPdfText, so a section can be split into multiple entries instead of one blob.
  const allLines = rawText.split("\n").map((l) => l.trim());
  const nonBlankLines = allLines.filter(Boolean);

  const email = rawText.match(EMAIL_RE)?.[0] ?? "";
  const phone = rawText.match(PHONE_RE)?.[0] ?? "";
  const linkedin = rawText.match(LINKEDIN_RE)?.[0] ?? "";
  const github = rawText.match(GITHUB_RE)?.[0] ?? "";

  const nameLine = nonBlankLines.find(
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
  // The "headline" line sits right below the name (role + city + phone, e.g. "Desenvolvedor
  // Full Stack (Node.js | React) Fortaleza, CE | (85) 99140-7312"). It isn't purely contact
  // info, so it used to fall through to the preamble and get glued onto the summary. Detected
  // here (before any section starts) by pulling out its phone/location and keeping the rest.
  let headline = "";
  let headlineLocation = "";

  const contactPatterns = [EMAIL_RE, LINKEDIN_RE, GITHUB_RE, ...(phone ? [PHONE_RE] : [])];

  for (const line of allLines) {
    if (line === "") {
      if (current && current.lines[current.lines.length - 1] !== "") {
        current.lines.push("");
      }
      continue;
    }
    if (line === nameLine) continue;
    if (isMostlyContactLine(line, contactPatterns)) continue;

    const header = detectHeader(line);
    if (header) {
      current = { type: header, lines: [] };
      sections.push(current);
      continue;
    }
    if (current) {
      // Kept raw (marker + all) here — mergeWrappedLines needs the original bullet marker to
      // tell a new bullet from a wrapped continuation line; cleanBullet runs per-section below.
      current.lines.push(line);
      continue;
    }

    const phoneMatch = line.match(PHONE_RE);
    const locMatch = line.match(LOCATION_RE);
    if (phoneMatch || locMatch) {
      if (locMatch && !headlineLocation) headlineLocation = locMatch[0];
      let residual = line;
      if (phoneMatch) residual = residual.replace(phoneMatch[0], "");
      if (locMatch) residual = residual.replace(locMatch[0], "");
      // Trim only leading/trailing separators left dangling by the removals above (e.g. the
      // " | " that used to sit between the headline and the phone) — a global strip would
      // also eat "|" used inside the headline itself (e.g. "(Node.js | React)").
      residual = residual
        .replace(/^[\s|•·,;:\-–]+/, "")
        .replace(/[\s|•·,;:\-–]+$/, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!headline && residual.length >= 3) headline = residual;
    } else {
      preamble.push(line);
    }
  }

  function sectionGroups(type: SectionType): string[][] {
    const lines: string[] = [];
    sections
      .filter((s) => s.type === type)
      .forEach((s, i) => {
        if (i > 0) lines.push("");
        lines.push(...s.lines);
      });
    return splitIntoGroups(lines);
  }

  const summaryGroups = sectionGroups("summary");
  const experienceGroups = sectionGroups("experience");
  const leadershipGroups = sectionGroups("leadership");
  const projectGroups = sectionGroups("projects");
  const educationGroups = sectionGroups("education");
  const skillsGroups = sectionGroups("skills");

  const summaryText = [...preamble, ...summaryGroups.flat().map(cleanBullet)].join(" ");

  const data: Partial<ResumeData> = {
    personal: {
      fullName: nameLine ?? "",
      headline,
      location: headlineLocation,
      email,
      phone,
      linkedin,
      linkedinText: "",
      github,
      githubText: "",
      website: "",
      websiteText: "",
    },
    summary: truncateAtWord(summaryText, 900),
  };

  if (experienceGroups.length > 0) {
    data.experiences = buildEntries(experienceGroups);
  }

  if (leadershipGroups.length > 0) {
    data.leadership = buildEntries(leadershipGroups);
  }

  if (educationGroups.length > 0) {
    data.education = educationGroups.map(buildEducationEntry);
  }

  if (projectGroups.length > 0) {
    data.projects = mergeHeaderGroups(projectGroups).map(({ header, body }) => ({
      id: "",
      name: cleanBullet(header),
      link: "",
      linkText: "",
      description: buildProjectDescription(body),
    }));
  }

  if (skillsGroups.length > 0) {
    data.skills = { technical: buildSkillsText(skillsGroups), languages: "" };
  }

  return data;
}
