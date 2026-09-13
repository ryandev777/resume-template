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

export interface ProfilesBackupFile {
  kind: "resume-builder-profiles-backup";
  version: 1;
  exportedAt: string;
  profiles: { name: string; data: ResumeData }[];
}

/** All saved profiles as one downloadable file — separate from the single-résumé "Backup
 * (.json)" export in the builder header, which only ever covers whatever's currently loaded. */
export function buildProfilesBackup(profiles: ResumeProfile[]): ProfilesBackupFile {
  return {
    kind: "resume-builder-profiles-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles: profiles.map((p) => ({ name: p.name, data: p.data })),
  };
}

/** Tolerant parse of a profiles backup file — same spirit as the JSON backup / shared-link
 * import elsewhere in this app: accept anything that's plausibly the right shape rather than a
 * strict schema check, and let the caller hydrate each `data` blob into a full ResumeData
 * (see hydrateSharedResume in lib/share.ts) since a hand-edited or older-format file might be
 * missing fields. Returns null only when the file isn't a profiles backup at all. */
export function parseProfilesBackup(
  json: unknown,
): { name: string; data: Partial<ResumeData> }[] | null {
  if (typeof json !== "object" || json === null) return null;
  const obj = json as { profiles?: unknown };
  if (!Array.isArray(obj.profiles)) return null;

  return (obj.profiles as unknown[])
    .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
    .map((p) => ({
      name: typeof p.name === "string" && p.name.trim() ? p.name : "Perfil importado",
      data: (p.data ?? {}) as Partial<ResumeData>,
    }));
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
  /** Appends one or more profiles at once (e.g. from a restored backup file), each getting a
   * fresh id/updatedAt — additive, existing profiles are left untouched. */
  importProfiles: (entries: { name: string; data: ResumeData }[]) => void;
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
      importProfiles: (entries) =>
        set((state) => ({
          profiles: [
            ...entries.map((e) => ({
              id: uid(),
              name: e.name,
              updatedAt: new Date().toISOString(),
              data: e.data,
            })),
            ...state.profiles,
          ],
        })),
    }),
    { name: "resume-builder-profiles" },
  ),
);
