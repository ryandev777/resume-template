"use client";

import { Field, Textarea } from "@/components/ui";
import { content } from "@/lib/content";
import { useResumeStore } from "@/lib/store";

export function SkillsForm() {
  const locale = useResumeStore((s) => s.locale);
  const skills = useResumeStore((s) => s.skills);
  const setSkills = useResumeStore((s) => s.setSkills);
  const t = content[locale];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {t.sectionTitles.skills}
        </h2>
      </div>
      <Field label={t.labels.technical}>
        <Textarea
          rows={3}
          value={skills.technical}
          placeholder={t.placeholders.technical}
          onChange={(e) => setSkills({ technical: e.target.value })}
        />
      </Field>
      <Field label={t.labels.languages}>
        <Textarea
          rows={2}
          value={skills.languages}
          placeholder={t.placeholders.languagesText}
          onChange={(e) => setSkills({ languages: e.target.value })}
        />
      </Field>
    </div>
  );
}
