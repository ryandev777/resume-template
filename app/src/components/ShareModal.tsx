"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { buildShareUrl } from "@/lib/share";
import type { Locale, ResumeData } from "@/lib/types";

/** Same modal shell as ConfirmModal/PdfReviewModal. Generates a #d=<data> link for the current
 * resume — compression/encoding happens in lib/share.ts, this component only owns the
 * include-contact choice, the generate action, and copy-to-clipboard feedback. */
export function ShareModal({
  data,
  locale,
  onClose,
}: {
  data: ResumeData;
  locale: Locale;
  onClose: () => void;
}) {
  const pt = locale === "pt-br";
  const [includeContact, setIncludeContact] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await buildShareUrl(data, { includeContact });
      if ("error" in result) {
        toast.error(
          result.error === "unsupported"
            ? pt
              ? "Seu navegador não suporta a compressão necessária para gerar o link. Use o PDF ou o backup .json."
              : "Your browser doesn't support the compression needed to generate the link. Use the PDF or the .json backup instead."
            : pt
              ? "Esse currículo é grande demais para virar um link. Use o PDF ou o backup .json em vez disso."
              : "This resume is too large to turn into a link. Use the PDF or the .json backup instead.",
        );
        return;
      }
      setShareUrl(result.url);
      try {
        await navigator.clipboard.writeText(result.url);
        toast.success(pt ? "Link copiado para a área de transferência." : "Link copied to clipboard.");
      } catch {
        toast.error(
          pt
            ? "Não foi possível copiar automaticamente — copie o link abaixo manualmente."
            : "Couldn't copy automatically — copy the link below manually.",
        );
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {pt ? "Compartilhar currículo" : "Share resume"}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {pt
            ? "Gera um link que carrega seus dados direto no navegador de quem abrir — nada é enviado ou salvo em nenhum servidor."
            : "Generates a link that loads your data straight into the browser of whoever opens it — nothing is sent to or stored on any server."}
        </p>

        <label className="mt-4 flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={includeContact}
            onChange={(e) => setIncludeContact(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            {pt ? "Incluir telefone e e-mail no link?" : "Include phone and email in the link?"}
            <span className="block text-xs text-slate-400 dark:text-slate-500">
              {pt
                ? "Quem receber o link vai ver tudo que estiver marcado aqui."
                : "Whoever receives the link will see everything checked here."}
            </span>
          </span>
        </label>

        {shareUrl && (
          <input
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={pt ? "Link gerado" : "Generated link"}
            className="mt-3 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          />
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            {pt ? "Fechar" : "Close"}
          </Button>
          <Button type="button" disabled={generating} onClick={handleGenerate}>
            {generating
              ? pt
                ? "Gerando…"
                : "Generating…"
              : pt
                ? "Gerar e copiar link"
                : "Generate and copy link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
