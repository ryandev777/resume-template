"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// The server can't know localStorage/matchMedia, so it always renders "light" — the inline
// beforeInteractive script in layout.tsx (kept in sync via THEME_STORAGE_KEY) has already set
// the real class on <html> before React hydrates, and useSyncExternalStore reconciles this
// component to that real DOM state right after hydration, without a manual effect+setState.
function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  // If the user never picked a theme manually, keep following the OS preference live.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  function onSystemChange() {
    if (localStorage.getItem(THEME_STORAGE_KEY)) return;
    applyTheme(getSystemTheme());
    callback();
  }
  media.addEventListener("change", onSystemChange);

  return () => {
    listeners.delete(callback);
    media.removeEventListener("change", onSystemChange);
  };
}

function notifyAll() {
  for (const cb of listeners) cb();
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    notifyAll();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-md transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 print:hidden"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}
