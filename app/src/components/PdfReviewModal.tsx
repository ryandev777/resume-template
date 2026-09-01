"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import type { Locale, ResumeData } from "@/lib/types";

type SectionKey =
  | "personal"
  | "summary"
  | "experiences"
  | "leadership"
  | "education"
  | "projects"
  | "skills";

interface SectionInfo {
  key: SectionKey;
  title: string;
  preview: string[];
}

function nonEmpty(v: string | undefined): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function buildSections(data: Partial<ResumeData>, locale: Locale): SectionInfo[] {
  const pt = locale === "pt-br";
  const sections: SectionInfo[] = [];

  const p = data.personal;
  if (p && (nonEmpty(p.fullName) || nonEmpty(p.email) || nonEmpty(p.phone) || nonEmpty(p.linkedin) || nonEmpty(p.github))) {
    sections.push({
      key: "personal",
      title: pt ? "Dados pessoais" : "Personal info",
      preview: [
        p.fullName && `${pt ? "Nome" : "Name"}: ${p.fullName}`,
        p.email && `Email: ${p.email}`,
        p.phone && `${pt ? "Telefone" : "Phone"}: ${p.phone}`,
        p.linkedin && `LinkedIn: ${p.linkedin}`,
        p.github && `GitHub: ${p.github}`,
      ].filter(Boolean) as string[],
    });
  }

  if (nonEmpty(data.summary)) {
    sections.push({
      key: "summary",
      title: pt ? "Resumo profissional" : "Professional summary",
      preview: [data.summary!],
    });
  }

  if (data.experiences?.some((e) => e.bullets.some(nonEmpty))) {
    sections.push({
      key: "experiences",
      title: pt ? "Experiência" : "Experience",
      preview: data.experiences!.flatMap((e) => e.bullets.filter(nonEmpty)),
    });
  }

  if (data.leadership?.some((e) => e.bullets.some(nonEmpty))) {
    sections.push({
      key: "leadership",
      title: pt ? "Atividades de liderança" : "Leadership activities",
      preview: data.leadership!.flatMap((e) => e.bullets.filter(nonEmpty)),
    });
  }

  if (data.education?.some((e) => nonEmpty(e.degree) || nonEmpty(e.institution))) {
    sections.push({
      key: "education",
      title: pt ? "Educação" : "Education",
      preview: data.education!.map((e) => [e.institution, e.degree].filter(Boolean).join(" — ")),
    });
  }

  if (data.projects?.some((e) => nonEmpty(e.description) || nonEmpty(e.name))) {
    sections.push({
      key: "projects",
      title: pt ? "Projetos" : "Projects",
      preview: data.projects!.map((e) => [e.name, e.description].filter(Boolean).join(" — ")),
    });
  }

  if (nonEmpty(data.skills?.technical)) {
    sections.push({
      key: "skills",
      title: pt ? "Habilidades técnicas" : "Technical skills",
      preview: [data.skills!.technical],
    });
  }

  return sections;
}

export function PdfReviewModal({
  data,
  locale,
  onCancel,
  onApply,
}: {
  data: Partial<ResumeData>;
  locale: Locale;
  onCancel: () => void;
  onApply: (selected: Partial<ResumeData>) => void;
}) {
  const pt = locale === "pt-br";
  const sections = useMemo(() => buildSections(data, locale), [data, locale]);
  const [checked, setChecked] = useState<Record<SectionKey, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.key, true])) as Record<SectionKey, boolean>,
  );

  function toggle(key: SectionKey) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleApply() {
    const selected: Partial<ResumeData> = {};
    for (const s of sections) {
      if (!checked[s.key]) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (selected as any)[s.key] = (data as any)[s.key];
    }
    onApply(selected);
  }

  const anyChecked = sections.some((s) => checked[s.key]);

  if (sections.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
          <h2 className="text-base font-semibold text-slate-900">
            {pt ? "Nada reconhecido no PDF" : "Nothing recognized in the PDF"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {pt
              ? "Não conseguimos identificar seções neste arquivo. Tente um PDF com texto selecionável (não uma imagem escaneada) ou preencha manualmente."
              : "We couldn't identify sections in this file. Try a PDF with selectable text (not a scanned image) or fill the form manually."}
          </p>
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={onCancel}>
              {pt ? "Fechar" : "Close"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900">
            {pt ? "Revise o que foi extraído do PDF" : "Review what was extracted from the PDF"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {pt
              ? "A leitura é aproximada. Marque só o que quer trazer para o formulário — o que ficar desmarcado não é alterado."
              : "Reading is approximate. Check only what you want to bring into the form — anything unchecked stays untouched."}
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {sections.map((s) => (
            <label
              key={s.key}
              className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 hover:border-slate-300"
            >
              <input
                type="checkbox"
                className="mt-1 shrink-0"
                checked={checked[s.key]}
                onChange={() => toggle(s.key)}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{s.title}</p>
                <ul className="mt-1 max-h-24 space-y-0.5 overflow-y-auto text-xs text-slate-600">
                  {s.preview.map((line, i) => (
                    <li key={i} className="truncate">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 p-5">
          <Button variant="secondary" type="button" onClick={onCancel}>
            {pt ? "Cancelar" : "Cancel"}
          </Button>
          <Button type="button" disabled={!anyChecked} onClick={handleApply}>
            {pt ? "Aplicar selecionados" : "Apply selected"}
          </Button>
        </div>
      </div>
    </div>
  );
}
