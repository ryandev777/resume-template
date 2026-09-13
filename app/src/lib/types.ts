export type Locale = "pt-br" | "en";

export interface PersonalInfo {
  fullName: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface Entry {
  id: string;
  org: string;
  location: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  location: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  link: string;
  description: string;
}

export interface SkillsData {
  technical: string;
  languages: string;
}

export interface ResumeData {
  locale: Locale;
  studentMode: boolean;
  /** Multiplier applied to every font size in the resume preview/PDF (1 = default). */
  fontScale: number;
  personal: PersonalInfo;
  summary: string;
  experiences: Entry[];
  leadership: Entry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  skills: SkillsData;
  jobDescription: string;
}

export const RESUME_DATA_KEYS: (keyof ResumeData)[] = [
  "locale",
  "studentMode",
  "fontScale",
  "personal",
  "summary",
  "experiences",
  "leadership",
  "education",
  "projects",
  "skills",
  "jobDescription",
];

export const FONT_SCALE_MIN = 0.85;
export const FONT_SCALE_MAX = 1.3;
export const FONT_SCALE_STEP = 0.05;
