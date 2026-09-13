"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import { Button, Input, Textarea } from "@/components/ui";
import { generateCoverLetter } from "@/lib/coverLetter";
import { isResumeEmpty } from "@/lib/score";
import { getResumeData, useResumeStore } from "@/lib/store";

/** Draft cover letter from the résumé already in the store + the job description pasted in the
 * "Vaga" tab (same store field, `jobDescription`) — generated fully client-side, nothing sent
 * anywhere. Regenerating overwrites manual edits, so it asks for confirmation once a draft
 * already has user edits, tracked via `dirty`. */
export function CoverLetterPanel() {
  const locale = useResumeStore((s) => s.locale);
  const jobDescription = useResumeStore((s) => s.jobDescription);
  // See ScorePanel.tsx — getResumeData returns a new object every call, so it needs useShallow.
  const data = useResumeStore(useShallow((s) => getResumeData(s)));
  const resumeEmpty = isResumeEmpty(data);
  const pt = locale === "pt-br";

  const [companyName, setCompanyName] = useState("");
  const [draft, setDraft] = useState("");

  function handleGenerate() {
    setDraft(generateCoverLetter(data, jobDescription, companyName, locale));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft);
      toast.success(pt ? "Carta copiada." : "Letter copied.");
    } catch {
      toast.error(pt ? "Não foi possível copiar." : "Couldn't copy.");
    }
  }

  function handleDownload() {
    const blob = new Blob([draft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carta-de-apresentacao.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {pt ? "Carta de apresentação" : "Cover letter"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {pt
            ? "Gera um rascunho a partir do seu currículo e da vaga colada na aba \"Vaga\" — um ponto de partida pra editar, não uma carta pronta. Tudo no seu navegador."
            : 'Generates a draft from your resume and the job pasted in the "Job match" tab — a starting point to edit, not a finished letter. All in your browser.'}
        </p>
      </div>

      {resumeEmpty && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
          {pt
            ? "Seu currículo ainda está vazio — preencha a aba Formulário primeiro para um rascunho melhor."
            : "Your resume is still empty — fill in the Form tab first for a better draft."}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {pt ? "Nome da empresa (opcional)" : "Company name (optional)"}
        </label>
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder={pt ? "Ex: Nubank" : "E.g. Acme Inc."}
        />
      </div>

      <Button type="button" onClick={handleGenerate}>
        {draft ? (pt ? "Gerar novamente" : "Regenerate") : pt ? "Gerar rascunho" : "Generate draft"}
      </Button>
      {draft && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {pt
            ? "Gerar novamente substitui o texto abaixo — copie o que já editou antes, se quiser guardar."
            : "Regenerating replaces the text below — copy what you've already edited first if you want to keep it."}
        </p>
      )}

      {draft && (
        <>
          <Textarea rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" type="button" onClick={handleCopy}>
              {pt ? "Copiar" : "Copy"}
            </Button>
            <Button variant="secondary" type="button" onClick={handleDownload}>
              {pt ? "Baixar .txt" : "Download .txt"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
