"use client";

import { useState } from "react";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { GithubImportModal } from "@/components/GithubImportModal";
import { content } from "@/lib/content";
import { useResumeStore } from "@/lib/store";

export function ProjectsForm() {
  const locale = useResumeStore((s) => s.locale);
  const projects = useResumeStore((s) => s.projects);
  const addProject = useResumeStore((s) => s.addProject);
  const updateProject = useResumeStore((s) => s.updateProject);
  const removeProject = useResumeStore((s) => s.removeProject);
  const importProjects = useResumeStore((s) => s.importProjects);
  const [importingFromGithub, setImportingFromGithub] = useState(false);
  const t = content[locale];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t.sectionTitles.projects}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {locale === "pt-br"
            ? "Opcional, mas muito valorizado para programadores — mostra código real."
            : "Optional, but highly valued for programmers — shows real code."}
        </p>
      </div>

      {projects.map((entry, idx) => (
        <Card key={entry.id}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t.sectionTitles.projects} #{idx + 1}
            </span>
            <Button variant="danger" type="button" onClick={() => removeProject(entry.id)}>
              Remover
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.labels.projectName}>
              <Input
                value={entry.name}
                placeholder={t.placeholders.projectName}
                onChange={(e) => updateProject(entry.id, { name: e.target.value })}
              />
            </Field>
            <Field label={t.labels.projectLink}>
              <Input
                value={entry.link}
                placeholder="github.com/usuario/projeto"
                onChange={(e) => updateProject(entry.id, { link: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label={t.labels.projectLinkText}>
              <Input
                value={entry.linkText}
                placeholder={t.placeholders.projectLinkText}
                onChange={(e) => updateProject(entry.id, { linkText: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label={t.labels.projectDescription}>
              <Textarea
                rows={2}
                value={entry.description}
                placeholder={t.placeholders.projectDescription}
                onChange={(e) =>
                  updateProject(entry.id, { description: e.target.value })
                }
              />
            </Field>
          </div>
        </Card>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" type="button" onClick={() => addProject()}>
          + {t.sectionTitles.projects}
        </Button>
        <Button variant="secondary" type="button" onClick={() => setImportingFromGithub(true)}>
          {locale === "pt-br" ? "Importar do GitHub" : "Import from GitHub"}
        </Button>
      </div>

      {importingFromGithub && (
        <GithubImportModal
          locale={locale}
          existingLinks={projects.map((p) => p.link)}
          onClose={() => setImportingFromGithub(false)}
          onImport={importProjects}
        />
      )}
    </div>
  );
}
