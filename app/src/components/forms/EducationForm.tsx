"use client";

import { Button, Card, Field, Input } from "@/components/ui";
import { content } from "@/lib/content";
import { useResumeStore } from "@/lib/store";

export function EducationForm() {
  const locale = useResumeStore((s) => s.locale);
  const education = useResumeStore((s) => s.education);
  const addEducation = useResumeStore((s) => s.addEducation);
  const updateEducation = useResumeStore((s) => s.updateEducation);
  const removeEducation = useResumeStore((s) => s.removeEducation);
  const studentMode = useResumeStore((s) => s.studentMode);
  const setStudentMode = useResumeStore((s) => s.setStudentMode);
  const t = content[locale];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t.sectionTitles.education}
        </h2>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <input
          type="checkbox"
          checked={studentMode}
          onChange={(e) => setStudentMode(e.target.checked)}
        />
        {t.labels.studentMode}
      </label>

      {education.map((entry, idx) => (
        <Card key={entry.id}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t.sectionTitles.education} #{idx + 1}
            </span>
            <Button
              variant="danger"
              type="button"
              onClick={() => removeEducation(entry.id)}
            >
              Remover
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.labels.institution}>
              <Input
                value={entry.institution}
                placeholder={t.placeholders.institution}
                onChange={(e) =>
                  updateEducation(entry.id, { institution: e.target.value })
                }
              />
            </Field>
            <Field label={t.labels.location}>
              <Input
                value={entry.location}
                placeholder={t.placeholders.location}
                onChange={(e) =>
                  updateEducation(entry.id, { location: e.target.value })
                }
              />
            </Field>
            <Field label={t.labels.degree}>
              <Input
                value={entry.degree}
                placeholder={t.placeholders.degree}
                onChange={(e) => updateEducation(entry.id, { degree: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t.labels.startDate}>
                <Input
                  value={entry.startDate}
                  placeholder="Jan 2020"
                  onChange={(e) =>
                    updateEducation(entry.id, { startDate: e.target.value })
                  }
                />
              </Field>
              <Field label={t.labels.endDate}>
                <Input
                  value={entry.endDate}
                  placeholder="Dez 2024"
                  onChange={(e) =>
                    updateEducation(entry.id, { endDate: e.target.value })
                  }
                />
              </Field>
            </div>
          </div>
        </Card>
      ))}

      <Button variant="secondary" type="button" onClick={() => addEducation()}>
        + {t.sectionTitles.education}
      </Button>
    </div>
  );
}
