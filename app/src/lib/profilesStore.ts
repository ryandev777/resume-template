import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ResumeData } from "./types";

export interface ResumeProfile {
  id: string;
  name: string;
  updatedAt: string;
  data: ResumeData;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface ProfilesStore {
  profiles: ResumeProfile[];
  /** Snapshots `data` as a brand-new profile. */
  saveAsProfile: (name: string, data: ResumeData) => void;
  /** Overwrites an existing profile's snapshot with the current résumé data — used for "update
   * this profile with what's on screen now" rather than creating a duplicate. */
  updateProfile: (id: string, data: ResumeData) => void;
  renameProfile: (id: string, name: string) => void;
  deleteProfile: (id: string) => void;
}

/** Named, full snapshots of ResumeData — lets someone keep e.g. a "Backend" and a "Dados"
 * version of their résumé side by side, each loadable into the single active useResumeStore.
 * Separate persisted store (different concern/lifecycle from the active résumé and from the
 * application tracker), same zustand + persist(localStorage) pattern used everywhere else. */
export const useProfilesStore = create<ProfilesStore>()(
  persist(
    (set) => ({
      profiles: [],
      saveAsProfile: (name, data) =>
        set((state) => ({
          profiles: [
            { id: uid(), name, updatedAt: new Date().toISOString(), data },
            ...state.profiles,
          ],
        })),
      updateProfile: (id, data) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, data, updatedAt: new Date().toISOString() } : p,
          ),
        })),
      renameProfile: (id, name) =>
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === id ? { ...p, name } : p)),
        })),
      deleteProfile: (id) =>
        set((state) => ({ profiles: state.profiles.filter((p) => p.id !== id) })),
    }),
    { name: "resume-builder-profiles" },
  ),
);
