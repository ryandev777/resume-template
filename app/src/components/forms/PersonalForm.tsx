"use client";

import { Field, Input, Textarea } from "@/components/ui";
import { content } from "@/lib/content";
import { useResumeStore } from "@/lib/store";

export function PersonalForm() {
  const locale = useResumeStore((s) => s.locale);
  const personal = useResumeStore((s) => s.personal);
  const setPersonal = useResumeStore((s) => s.setPersonal);
  const t = content[locale];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t.steps[0]}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t.labels.fullName}>
          <Input
            value={personal.fullName}
            placeholder={t.placeholders.fullName}
            onChange={(e) => setPersonal({ fullName: e.target.value })}
          />
        </Field>
        <Field label={t.labels.headline}>
          <Input
            value={personal.headline}
            placeholder={t.placeholders.headline}
            onChange={(e) => setPersonal({ headline: e.target.value })}
          />
        </Field>
        <Field label={t.labels.location}>
          <Input
            value={personal.location}
            placeholder={t.placeholders.location}
            onChange={(e) => setPersonal({ location: e.target.value })}
          />
        </Field>
        <Field label={t.labels.email}>
          <Input
            value={personal.email}
            placeholder={t.placeholders.email}
            onChange={(e) => setPersonal({ email: e.target.value })}
          />
        </Field>
        <Field label={t.labels.phone}>
          <Input
            value={personal.phone}
            placeholder={t.placeholders.phone}
            onChange={(e) => setPersonal({ phone: e.target.value })}
          />
        </Field>
        <Field label={t.labels.linkedin}>
          <Input
            value={personal.linkedin}
            placeholder={t.placeholders.linkedin}
            onChange={(e) => setPersonal({ linkedin: e.target.value })}
          />
        </Field>
        <Field label={t.labels.github}>
          <Input
            value={personal.github}
            placeholder={t.placeholders.github}
            onChange={(e) => setPersonal({ github: e.target.value })}
          />
        </Field>
        <Field label={t.labels.website}>
          <Input
            value={personal.website}
            placeholder={t.placeholders.website}
            onChange={(e) => setPersonal({ website: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

export function SummaryForm() {
  const locale = useResumeStore((s) => s.locale);
  const summary = useResumeStore((s) => s.summary);
  const setSummary = useResumeStore((s) => s.setSummary);
  const t = content[locale];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t.steps[1]}</h2>
      </div>
      <Field label={t.labels.summary}>
        <Textarea
          rows={5}
          value={summary}
          placeholder={t.placeholders.summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </Field>
    </div>
  );
}
