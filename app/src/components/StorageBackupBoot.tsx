"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useResumeStore } from "@/lib/store";
import { useApplicationsStore } from "@/lib/applicationsStore";
import { setupStorageBackup } from "@/lib/backupSync";

/** Mounted once in the root layout. Wires both localStorage-backed zustand stores (the résumé
 * builder and the job-application Kanban board) to a redundant IndexedDB copy — see
 * lib/backupSync.ts for the restore-on-boot / mirror-on-change logic. Renders nothing. */
export function StorageBackupBoot() {
  useEffect(() => {
    const cleanups = [
      setupStorageBackup(useResumeStore, "resume-builder-storage", () =>
        toast.info(
          "Dados do currículo restaurados de uma cópia de segurança local (IndexedDB).",
        ),
      ),
      setupStorageBackup(useApplicationsStore, "resume-builder-applications", () =>
        toast.info(
          "Candidaturas salvas restauradas de uma cópia de segurança local (IndexedDB).",
        ),
      ),
    ];
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
