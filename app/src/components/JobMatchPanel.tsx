"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Textarea } from "@/components/ui";
import { matchKeywords } from "@/lib/keywords";
import { isResumeEmpty } from "@/lib/score";
import { getResumeData, useResumeStore } from "@/lib/store";

export function JobMatchPanel() {
  const locale = useResumeStore((s) => s.locale);
  const jobDescription = useResumeStore((s) => s.jobDescription);
  const setJobDescription = useResumeStore((s) => s.setJobDescription);
  // See ScorePanel.tsx — getResumeData returns a new object every call, so it needs useShallow
  // or React logs "getSnapshot should be cached to avoid an infinite loop" on every render.
  const data = useResumeStore(useShallow((s) => getResumeData(s)));
  const resumeEmpty = isResumeEmpty(data);

  const results = useMemo(
    () => (jobDescription.trim() ? matchKeywords(jobDescription, data, locale) : []),
    [jobDescription, data, locale],
  );

  const matched = results.filter((r) => r.matched);
  const missing = results.filter((r) => !r.matched);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {locale === "pt-br" ? "Comparar com a vaga" : "Match against a job post"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {locale === "pt-br"
            ? "Cole a descrição da vaga. Comparamos as palavras mais frequentes nela com o texto do seu currículo — tudo no seu navegador, nada é enviado a servidor algum."
            : "Paste the job description. We compare its most frequent words against your resume text — all in your browser, nothing is sent to any server."}
        </p>
      </div>

      {resumeEmpty && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
          {locale === "pt-br" ? (
            <>
              Seu currículo ainda está vazio — preencha a aba{" "}
              <span className="font-semibold">Formulário</span> primeiro, ou a comparação abaixo
              não vai encontrar nenhuma palavra-chave em comum.
            </>
          ) : (
            <>
              Your resume is still empty — fill in the{" "}
              <span className="font-semibold">Form</span> tab first, or the comparison below
              won&apos;t find any keywords in common.
            </>
          )}
        </div>
      )}

      <Textarea
        rows={8}
        value={jobDescription}
        placeholder={
          locale === "pt-br"
            ? "Cole aqui o texto completo da vaga..."
            : "Paste the full job post here..."
        }
        onChange={(e) => setJobDescription(e.target.value)}
      />

      {!jobDescription.trim() && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {locale === "pt-br" ? (
            <>
              Ainda não há nada colado aqui. Assim que você colar a vaga, aparece: quantas
              palavras-chave da vaga já estão no seu currículo, quais estão faltando (para você
              considerar incluir) e quais já estão presentes.
            </>
          ) : (
            <>
              Nothing pasted here yet. Once you paste a job post, you&apos;ll see: how many of its
              keywords already appear in your resume, which ones are missing (worth considering),
              and which ones are already covered.
            </>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {matched.length}/{results.length}{" "}
              {locale === "pt-br"
                ? "palavras-chave da vaga aparecem no seu currículo"
                : "job keywords appear in your resume"}
            </p>
          </div>

          {missing.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {locale === "pt-br" ? "Faltando (considere incluir)" : "Missing (consider adding)"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((r) => (
                  <span
                    key={r.word}
                    className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300"
                    title={`${r.count}x`}
                  >
                    {r.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {matched.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {locale === "pt-br" ? "Já presentes" : "Already present"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matched.map((r) => (
                  <span
                    key={r.word}
                    className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                    title={`${r.count}x`}
                  >
                    {r.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 dark:text-slate-500">
            {locale === "pt-br"
              ? "Só inclua palavras que refletem sua experiência real — inserir termos sem ter a habilidade correspondente costuma sair pior em entrevista."
              : "Only add words that reflect your real experience — stuffing keywords you can't back up usually backfires in the interview."}
          </p>
        </div>
      )}
    </div>
  );
}
