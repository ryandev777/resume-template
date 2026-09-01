"use client";

import type { Entry } from "@/lib/types";
import { Button, Card, Field, Input } from "@/components/ui";
import { content } from "@/lib/content";
import { useResumeStore } from "@/lib/store";

export function EntryListForm({
  kind,
  title,
  description,
}: {
  kind: "experiences" | "leadership";
  title: string;
  description: string;
}) {
  const locale = useResumeStore((s) => s.locale);
  const entries = useResumeStore((s) => s[kind]);
  const t = content[locale];

  const add = useResumeStore((s) =>
    kind === "experiences" ? s.addExperience : s.addLeadership,
  );
  const update = useResumeStore((s) =>
    kind === "experiences" ? s.updateExperience : s.updateLeadership,
  );
  const remove = useResumeStore((s) =>
    kind === "experiences" ? s.removeExperience : s.removeLeadership,
  );

  function updateBullet(entry: Entry, index: number, value: string) {
    const bullets = [...entry.bullets];
    bullets[index] = value;
    update(entry.id, { bullets });
  }

  function addBullet(entry: Entry) {
    update(entry.id, { bullets: [...entry.bullets, ""] });
  }

  function removeBullet(entry: Entry, index: number) {
    const bullets = entry.bullets.filter((_, i) => i !== index);
    update(entry.id, { bullets: bullets.length ? bullets : [""] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      {entries.map((entry, idx) => (
        <Card key={entry.id}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {title} #{idx + 1}
            </span>
            <Button variant="danger" onClick={() => remove(entry.id)} type="button">
              Remover
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.labels.org}>
              <Input
                value={entry.org}
                placeholder={t.placeholders.org}
                onChange={(e) => update(entry.id, { org: e.target.value })}
              />
            </Field>
            <Field label={t.labels.location}>
              <Input
                value={entry.location}
                placeholder={t.placeholders.location}
                onChange={(e) => update(entry.id, { location: e.target.value })}
              />
            </Field>
            <Field label={t.labels.role}>
              <Input
                value={entry.role}
                placeholder={t.placeholders.role}
                onChange={(e) => update(entry.id, { role: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t.labels.startDate}>
                <Input
                  value={entry.startDate}
                  placeholder="Jan 2023"
                  onChange={(e) => update(entry.id, { startDate: e.target.value })}
                />
              </Field>
              <Field label={t.labels.endDate}>
                <Input
                  value={entry.endDate}
                  placeholder={locale === "pt-br" ? "Atual" : "Present"}
                  disabled={entry.current}
                  onChange={(e) => update(entry.id, { endDate: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={entry.current}
              onChange={(e) =>
                update(entry.id, {
                  current: e.target.checked,
                  endDate: e.target.checked
                    ? locale === "pt-br"
                      ? "Atual"
                      : "Present"
                    : "",
                })
              }
            />
            {t.labels.current}
          </label>

          <div className="mt-4">
            <Label bullets={t.labels.bullets} />
            <div className="space-y-2">
              {entry.bullets.map((bullet, bIdx) => (
                <div key={bIdx} className="flex gap-2">
                  <Input
                    value={bullet}
                    placeholder={t.placeholders.bullet}
                    onChange={(e) => updateBullet(entry, bIdx, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => removeBullet(entry, bIdx)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              type="button"
              className="mt-2"
              onClick={() => addBullet(entry)}
            >
              + {locale === "pt-br" ? "Adicionar realização" : "Add achievement"}
            </Button>
          </div>
        </Card>
      ))}

      <Button variant="secondary" type="button" onClick={() => add()}>
        + {title}
      </Button>
    </div>
  );
}

function Label({ bullets }: { bullets: string }) {
  return (
    <label className="mb-1 block text-xs font-medium text-slate-600">
      {bullets}
    </label>
  );
}
