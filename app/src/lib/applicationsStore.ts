import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ApplicationStatus = "saved" | "applied" | "interview" | "rejected" | "offer";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "interview",
  "rejected",
  "offer",
];

export interface SavedApplication {
  /** Same id as the feed card it came from (source-prefixed, see lib/feed.ts) — used to detect
   * "already saved" so the same job can't be added twice. */
  id: string;
  title: string;
  company: string;
  url: string;
  source: string;
  savedAt: string;
  status: ApplicationStatus;
}

interface ApplicationsStore {
  applications: SavedApplication[];
  saveJob: (job: Omit<SavedApplication, "savedAt" | "status">) => void;
  updateStatus: (id: string, status: ApplicationStatus) => void;
  removeApplication: (id: string) => void;
  /** Moves an application to `status`, positioned at `destIndex` among the OTHER applications
   * that already have that status (i.e. the index within that Kanban column, not the whole
   * array) — used by the drag-and-drop board so both cross-column moves and same-column
   * reordering persist in the underlying array order. */
  reorderApplication: (id: string, status: ApplicationStatus, destIndex: number) => void;
}

/** Personal application tracker — separate persisted store from useResumeStore (different
 * concern, different lifecycle: clearing the résumé shouldn't wipe saved jobs and vice versa),
 * same zustand + persist(localStorage) pattern used everywhere else in this app. */
export const useApplicationsStore = create<ApplicationsStore>()(
  persist(
    (set) => ({
      applications: [],
      saveJob: (job) =>
        set((state) => {
          if (state.applications.some((a) => a.id === job.id)) return state;
          return {
            applications: [
              { ...job, savedAt: new Date().toISOString(), status: "saved" as const },
              ...state.applications,
            ],
          };
        }),
      updateStatus: (id, status) =>
        set((state) => ({
          applications: state.applications.map((a) => (a.id === id ? { ...a, status } : a)),
        })),
      removeApplication: (id) =>
        set((state) => ({ applications: state.applications.filter((a) => a.id !== id) })),
      reorderApplication: (id, status, destIndex) =>
        set((state) => {
          const moved = state.applications.find((a) => a.id === id);
          if (!moved) return state;
          const rest = state.applications.filter((a) => a.id !== id);
          const updated = { ...moved, status };

          const sameStatusPositions = rest.reduce<number[]>((acc, a, i) => {
            if (a.status === status) acc.push(i);
            return acc;
          }, []);

          const insertAt =
            sameStatusPositions.length === 0
              ? rest.length
              : destIndex >= sameStatusPositions.length
                ? sameStatusPositions[sameStatusPositions.length - 1] + 1
                : sameStatusPositions[destIndex];

          return { applications: [...rest.slice(0, insertAt), updated, ...rest.slice(insertAt)] };
        }),
    }),
    { name: "resume-builder-applications" },
  ),
);
