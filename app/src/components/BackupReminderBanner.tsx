"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/lib/types";

const DISMISS_KEY = "resume-builder-backup-reminder-dismissed";
const listeners = new Set<() => void>();

function getSnapshot(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

// The server can't know sessionStorage, so it renders as dismissed — same
// useSyncExternalStore pattern as ThemeToggle.tsx, which reconciles to the real value right
// after hydration without a manual effect+setState (and without a hydration mismatch warning).
function getServerSnapshot(): boolean {
  return true;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function dismiss() {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // best-effort — private browsing or storage disabled, nothing to fall back to here
  }
  for (const cb of listeners) cb();
}

/** Reminds the user that everything lives only in this browser's storage (no backend) — cleared
 * "cookies and site data" (the combined option most browsers default to) wipes it along with
 * localStorage/IndexedDB. Dismissal is sessionStorage-based on purpose: it goes away for the
 * current visit instead of forever, so it resurfaces the next time the app is opened rather than
 * being silenced once and never seen again. */
export function BackupReminderBanner({
  locale,
  onBackup,
}: {
  locale: Locale;
  onBackup: () => void;
}) {
  const pt = locale === "pt-br";
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (dismissed) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 print:hidden">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
        <span className="flex-1">
          {pt
            ? "Seus dados ficam salvos só neste navegador. Se limpar \"cookies e dados do site\" (ou trocar de navegador/computador), tudo some. Baixe um backup de vez em quando."
            : 'Your data is saved only in this browser. Clearing "cookies and site data" (or switching browsers/computers) erases it. Download a backup once in a while.'}
        </span>
        <button
          type="button"
          onClick={onBackup}
          className="shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-200 dark:hover:bg-amber-950/50"
        >
          {pt ? "Baixar backup (.json)" : "Download backup (.json)"}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={pt ? "Fechar aviso" : "Close notice"}
          className="shrink-0 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200"
        >
          ×
        </button>
      </div>
    </div>
  );
}
