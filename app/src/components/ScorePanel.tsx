"use client";

import { computeChecklist } from "@/lib/score";
import { getResumeData, useResumeStore } from "@/lib/store";

export function ScorePanel() {
  const locale = useResumeStore((s) => s.locale);
  const data = useResumeStore((s) => getResumeData(s));
  const checks = computeChecklist(data, locale);
  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {locale === "pt-br" ? "Checklist do currículo" : "Resume checklist"}
        </h2>
        <p className="text-sm text-slate-500">
          {locale === "pt-br"
            ? "Regras simples, sem IA — só para não esquecer o básico."
            : "Simple rules, no AI — just to avoid missing the basics."}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-2xl font-bold text-slate-900">
          {passedCount}/{checks.length}
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{ width: `${(passedCount / checks.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {checks.map((check) => (
          <li
            key={check.id}
            className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3"
          >
            <span
              className={
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                (check.passed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-400")
              }
            >
              {check.passed ? "✓" : "–"}
            </span>
            <div>
              <p
                className={
                  "text-sm font-medium " +
                  (check.passed ? "text-slate-900" : "text-slate-600")
                }
              >
                {check.label}
              </p>
              <p className="text-xs text-slate-500">{check.hint}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
