import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Entry,
  EducationEntry,
  ProjectEntry,
  Locale,
  ResumeData,
} from "./types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyEntry(): Entry {
  return {
    id: uid(),
    org: "",
    location: "",
    role: "",
    startDate: "",
    endDate: "",
    current: false,
    bullets: [""],
  };
}

function emptyEducation(): EducationEntry {
  return {
    id: uid(),
    institution: "",
    location: "",
    degree: "",
    startDate: "",
    endDate: "",
  };
}

function emptyProject(): ProjectEntry {
  return { id: uid(), name: "", link: "", description: "" };
}

const initialState: ResumeData = {
  locale: "pt-br",
  studentMode: false,
  personal: {
    fullName: "",
    location: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    website: "",
  },
  summary: "",
  experiences: [emptyEntry()],
  leadership: [],
  education: [emptyEducation()],
  projects: [],
  skills: { technical: "", languages: "" },
};

interface ResumeStore extends ResumeData {
  setLocale: (l: Locale) => void;
  setStudentMode: (v: boolean) => void;
  setPersonal: (p: Partial<ResumeData["personal"]>) => void;
  setSummary: (s: string) => void;

  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<Entry>) => void;
  removeExperience: (id: string) => void;

  addLeadership: () => void;
  updateLeadership: (id: string, patch: Partial<Entry>) => void;
  removeLeadership: (id: string) => void;

  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<EducationEntry>) => void;
  removeEducation: (id: string) => void;

  addProject: () => void;
  updateProject: (id: string, patch: Partial<ProjectEntry>) => void;
  removeProject: (id: string) => void;

  setSkills: (patch: Partial<ResumeData["skills"]>) => void;

  reset: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      ...initialState,

      setLocale: (locale) => set({ locale }),
      setStudentMode: (studentMode) => set({ studentMode }),
      setPersonal: (patch) =>
        set((state) => ({ personal: { ...state.personal, ...patch } })),
      setSummary: (summary) => set({ summary }),

      addExperience: () =>
        set((state) => ({ experiences: [...state.experiences, emptyEntry()] })),
      updateExperience: (id, patch) =>
        set((state) => ({
          experiences: state.experiences.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        })),
      removeExperience: (id) =>
        set((state) => ({
          experiences: state.experiences.filter((e) => e.id !== id),
        })),

      addLeadership: () =>
        set((state) => ({ leadership: [...state.leadership, emptyEntry()] })),
      updateLeadership: (id, patch) =>
        set((state) => ({
          leadership: state.leadership.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        })),
      removeLeadership: (id) =>
        set((state) => ({
          leadership: state.leadership.filter((e) => e.id !== id),
        })),

      addEducation: () =>
        set((state) => ({ education: [...state.education, emptyEducation()] })),
      updateEducation: (id, patch) =>
        set((state) => ({
          education: state.education.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        })),
      removeEducation: (id) =>
        set((state) => ({
          education: state.education.filter((e) => e.id !== id),
        })),

      addProject: () =>
        set((state) => ({ projects: [...state.projects, emptyProject()] })),
      updateProject: (id, patch) =>
        set((state) => ({
          projects: state.projects.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        })),
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((e) => e.id !== id),
        })),

      setSkills: (patch) =>
        set((state) => ({ skills: { ...state.skills, ...patch } })),

      reset: () => set({ ...initialState, experiences: [emptyEntry()], education: [emptyEducation()] }),
    }),
    { name: "resume-builder-storage" },
  ),
);

export { emptyEntry, emptyEducation, emptyProject };
