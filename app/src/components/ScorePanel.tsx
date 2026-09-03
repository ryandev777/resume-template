"use client";

import { useShallow } from "zustand/react/shallow";
import { computeChecklist, isResumeEmpty } from "@/lib/score";
import { getResumeData, useResumeStore } from "@/lib/store";

export function ScorePanel() {
  const locale = useResumeStore((s) => s.locale);
  // getResumeData builds a new object every call, so without useShallow every render sees a
  // "changed" snapshot — React's getSnapshot-consistency check then logs "should be cached to
  // avoid an infinite loop" (visible in the console/dev overlay on every keystroke).
  const data = useResumeStore(useShallow((s) => getResumeData(s)));
  const checks = computeChecklist(data, locale);
  const passedCount = checks.filter((c) => c.passed).length;
  const empty = isResumeEmpty(data);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {locale === "pt-br" ? "Checklist do currículo" : "Resume checklist"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {locale === "pt-br"
            ? "Regras simples, sem IA, que checam automaticamente conforme você preenche o formulário — sem precisar clicar em nada."
            : "Simple, no-AI rules that check automatically as you fill in the form — nothing to click."}
        </p>
      </div>

      {empty && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
          {locale === "pt-br" ? (
            <>
              Nada preenchido ainda, por isso tudo abaixo está com &quot;–&quot;. Vá para a aba{" "}
              <span className="font-semibold">Formulário</span> e preencha nome, resumo,
              experiência etc. — volte aqui a qualquer momento para ver o que ainda falta.
            </>
          ) : (
            <>
              Nothing filled in yet, so everything below shows &quot;–&quot;. Go to the{" "}
              <span className="font-semibold">Form</span> tab and fill in your name, summary,
              experience, etc. — come back here anytime to see what&apos;s still missing.
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {passedCount}/{checks.length}
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-slate-900 transition-all dark:bg-slate-100"
            style={{ width: `${(passedCount / checks.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {checks.map((check) => (
          <li
            key={check.id}
            className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <span
              className={
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                (check.passed
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500")
              }
            >
              {check.passed ? "✓" : "–"}
            </span>
            <div>
              <p
                className={
                  "text-sm font-medium " +
                  (check.passed
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-600 dark:text-slate-400")
                }
              >
                {check.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{check.hint}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
