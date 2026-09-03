"use client";

import { content } from "@/lib/content";
import { useResumeStore } from "@/lib/store";

export function TipsPanel() {
  const locale = useResumeStore((s) => s.locale);
  const t = content[locale];

  return (
    <div className="space-y-5">
      {t.tips.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{section.title}</h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-slate-600 dark:text-slate-400">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {locale === "pt-br" ? "Verbos de ação" : "Action verbs"}
        </h3>
        <div className="mt-1.5 space-y-2">
          {t.actionVerbs.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{group.group}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{group.verbs.join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
