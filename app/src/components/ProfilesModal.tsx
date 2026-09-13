"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useProfilesStore } from "@/lib/profilesStore";
import type { Locale, ResumeData } from "@/lib/types";

/** Lets someone keep more than one résumé version (e.g. "Backend", "Dados") in the same
 * localStorage-backed app — each profile is a full ResumeData snapshot in useProfilesStore,
 * loaded into the single active useResumeStore on demand via `onLoad`. Same modal shell as
 * ShareModal/ConfirmModal. */
export function ProfilesModal({
  currentData,
  locale,
  onClose,
  onLoad,
}: {
  currentData: ResumeData;
  locale: Locale;
  onClose: () => void;
  onLoad: (data: ResumeData) => void;
}) {
  const pt = locale === "pt-br";
  const profiles = useProfilesStore((s) => s.profiles);
  const saveAsProfile = useProfilesStore((s) => s.saveAsProfile);
  const updateProfile = useProfilesStore((s) => s.updateProfile);
  const deleteProfile = useProfilesStore((s) => s.deleteProfile);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleSaveNew() {
    const name = newName.trim();
    if (!name) return;
    saveAsProfile(name, currentData);
    setNewName("");
    toast.success(pt ? "Perfil salvo." : "Profile saved.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {pt ? "Perfis de currículo" : "Resume profiles"}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {pt
            ? "Guarde versões diferentes do seu currículo (ex: \"Backend\", \"Dados\") e alterne entre elas. Tudo salvo só no seu navegador."
            : 'Keep separate versions of your resume (e.g. "Backend", "Data") and switch between them. Everything is saved only in your browser.'}
        </p>

        <div className="mt-4 flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={pt ? "Nome do novo perfil" : "New profile name"}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNew();
            }}
          />
          <Button type="button" variant="secondary" onClick={handleSaveNew} disabled={!newName.trim()}>
            {pt ? "Salvar atual" : "Save current"}
          </Button>
        </div>

        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {profiles.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {pt ? "Nenhum perfil salvo ainda." : "No profiles saved yet."}
            </p>
          ) : (
            profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-200 p-2 dark:border-slate-700"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(p.updatedAt).toLocaleDateString(pt ? "pt-BR" : "en-US")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onLoad(p.data);
                      toast.success(pt ? `Perfil "${p.name}" carregado.` : `Loaded profile "${p.name}".`);
                      onClose();
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {pt ? "Carregar" : "Load"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateProfile(p.id, currentData);
                      toast.success(pt ? "Perfil atualizado." : "Profile updated.");
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    title={pt ? "Sobrescrever com o currículo atual" : "Overwrite with the current resume"}
                  >
                    {pt ? "Atualizar" : "Update"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(p.id)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    {pt ? "Excluir" : "Delete"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>
            {pt ? "Fechar" : "Close"}
          </Button>
        </div>
      </div>

      {deletingId && (
        <ConfirmModal
          title={pt ? "Excluir perfil?" : "Delete profile?"}
          message={
            pt
              ? "Essa ação não pode ser desfeita."
              : "This action can't be undone."
          }
          confirmLabel={pt ? "Excluir" : "Delete"}
          cancelLabel={pt ? "Cancelar" : "Cancel"}
          onCancel={() => setDeletingId(null)}
          onConfirm={() => {
            deleteProfile(deletingId);
            setDeletingId(null);
            toast.success(pt ? "Perfil excluído." : "Profile deleted.");
          }}
        />
      )}
    </div>
  );
}
