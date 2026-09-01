"use client";

import { useMemo } from "react";
import { Textarea } from "@/components/ui";
import { matchKeywords } from "@/lib/keywords";
import { getResumeData, useResumeStore } from "@/lib/store";

export function JobMatchPanel() {
  const locale = useResumeStore((s) => s.locale);
  const jobDescription = useResumeStore((s) => s.jobDescription);
  const setJobDescription = useResumeStore((s) => s.setJobDescription);
  const data = useResumeStore((s) => getResumeData(s));

  const results = useMemo(
    () => (jobDescription.trim() ? matchKeywords(jobDescription, data, locale) : []),
    [jobDescription, data, locale],
  );

  const matched = results.filter((r) => r.matched);
  const missing = results.filter((r) => !r.matched);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {locale === "pt-br" ? "Comparar com a vaga" : "Match against a job post"}
        </h2>
        <p className="text-sm text-slate-500">
          {locale === "pt-br"
            ? "Cole a descrição da vaga. Comparamos as palavras mais frequentes nela com o texto do seu currículo — tudo no seu navegador, nada é enviado a servidor algum."
            : "Paste the job description. We compare its most frequent words against your resume text — all in your browser, nothing is sent to any server."}
        </p>
      </div>

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

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-sm font-medium text-slate-900">
              {matched.length}/{results.length}{" "}
              {locale === "pt-br"
                ? "palavras-chave da vaga aparecem no seu currículo"
                : "job keywords appear in your resume"}
            </p>
          </div>

          {missing.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {locale === "pt-br" ? "Faltando (considere incluir)" : "Missing (consider adding)"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((r) => (
                  <span
                    key={r.word}
                    className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs text-amber-800"
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
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {locale === "pt-br" ? "Já presentes" : "Already present"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matched.map((r) => (
                  <span
                    key={r.word}
                    className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800"
                    title={`${r.count}x`}
                  >
                    {r.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400">
            {locale === "pt-br"
              ? "Só inclua palavras que refletem sua experiência real — inserir termos sem ter a habilidade correspondente costuma sair pior em entrevista."
              : "Only add words that reflect your real experience — stuffing keywords you can't back up usually backfires in the interview."}
          </p>
        </div>
      )}
    </div>
  );
}
