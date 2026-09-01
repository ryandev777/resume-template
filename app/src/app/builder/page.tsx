"use client";

import Link from "next/link";
import { useState } from "react";
import { Wizard } from "@/components/Wizard";
import { TipsPanel } from "@/components/TipsPanel";
import { ResumeDocument } from "@/components/preview/ResumeDocument";
import { Button } from "@/components/ui";
import { useResumeStore } from "@/lib/store";

export default function BuilderPage() {
  const locale = useResumeStore((s) => s.locale);
  const setLocale = useResumeStore((s) => s.setLocale);
  const reset = useResumeStore((s) => s.reset);
  const [tab, setTab] = useState<"form" | "tips">("form");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="print:hidden flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-slate-900">
          ← resume-template
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-slate-300">
            <button
              type="button"
              onClick={() => setLocale("pt-br")}
              className={
                "px-3 py-1.5 text-xs font-medium " +
                (locale === "pt-br"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50")
              }
            >
              PT-BR
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={
                "px-3 py-1.5 text-xs font-medium " +
                (locale === "en"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50")
              }
            >
              EN
            </button>
          </div>
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              if (confirm(locale === "pt-br" ? "Limpar todos os dados?" : "Clear all data?")) {
                reset();
              }
            }}
          >
            {locale === "pt-br" ? "Limpar" : "Clear"}
          </Button>
          <Button type="button" onClick={() => window.print()}>
            {locale === "pt-br" ? "Baixar PDF" : "Download PDF"}
          </Button>
        </div>
      </header>

      <div className="print:hidden mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="mb-4 flex gap-1.5">
            <button
              type="button"
              onClick={() => setTab("form")}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium " +
                (tab === "form"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200")
              }
            >
              {locale === "pt-br" ? "Formulário" : "Form"}
            </button>
            <button
              type="button"
              onClick={() => setTab("tips")}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium " +
                (tab === "tips"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200")
              }
            >
              {locale === "pt-br" ? "Dicas" : "Tips"}
            </button>
          </div>
          {tab === "form" ? <Wizard /> : <TipsPanel />}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-slate-200 bg-slate-100 p-4">
            <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded shadow">
              <ResumeDocument />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden print:block">
        <ResumeDocument />
      </div>
    </div>
  );
}
