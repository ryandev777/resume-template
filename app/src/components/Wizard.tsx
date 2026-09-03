"use client";

import { useState } from "react";
import { content } from "@/lib/content";
import { useResumeStore } from "@/lib/store";
import { PersonalForm, SummaryForm } from "@/components/forms/PersonalForm";
import { EntryListForm } from "@/components/forms/EntryListForm";
import { EducationForm } from "@/components/forms/EducationForm";
import { ProjectsForm } from "@/components/forms/ProjectsForm";
import { SkillsForm } from "@/components/forms/SkillsForm";
import { Button } from "@/components/ui";

export function Wizard() {
  const locale = useResumeStore((s) => s.locale);
  const t = content[locale];
  const [step, setStep] = useState(0);

  const steps = [
    <PersonalForm key="personal" />,
    <SummaryForm key="summary" />,
    <EntryListForm
      key="experience"
      kind="experiences"
      title={t.sectionTitles.experience}
      description={
        locale === "pt-br"
          ? "Da mais recente para a mais antiga. Foque em resultados, não só tarefas."
          : "Most recent first. Focus on outcomes, not just duties."
      }
    />,
    <EntryListForm
      key="leadership"
      kind="leadership"
      title={t.sectionTitles.leadership}
      description={
        locale === "pt-br"
          ? "Opcional: trabalho voluntário, ligas acadêmicas, cargos de liderança."
          : "Optional: volunteer work, academic clubs, leadership roles."
      }
    />,
    <ProjectsForm key="projects" />,
    <EducationForm key="education" />,
    <SkillsForm key="skills" />,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5">
        {t.steps.map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(idx)}
            className={
              "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
              (idx === step
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700")
            }
          >
            {idx + 1}. {label}
          </button>
        ))}
      </div>

      <div>{steps[step]}</div>

      <div className="flex justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
        <Button
          variant="secondary"
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          {locale === "pt-br" ? "Voltar" : "Back"}
        </Button>
        <Button
          type="button"
          disabled={step === steps.length - 1}
          onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
        >
          {locale === "pt-br" ? "Próximo" : "Next"}
        </Button>
      </div>
    </div>
  );
}
