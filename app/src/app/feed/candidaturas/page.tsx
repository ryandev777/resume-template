"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { relativeTime } from "@/lib/feed";
import {
  APPLICATION_STATUSES,
  useApplicationsStore,
  type ApplicationStatus,
  type SavedApplication,
} from "@/lib/applicationsStore";
import { useResumeStore } from "@/lib/store";

function statusLabel(status: ApplicationStatus, pt: boolean): string {
  if (status === "saved") return pt ? "Salvo" : "Saved";
  if (status === "applied") return pt ? "Aplicado" : "Applied";
  if (status === "interview") return pt ? "Entrevista" : "Interview";
  if (status === "rejected") return pt ? "Recusado" : "Rejected";
  return pt ? "Oferta" : "Offer";
}

const STATUS_COLUMN_STYLES: Record<ApplicationStatus, string> = {
  saved: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50",
  applied: "border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/30",
  interview: "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
  rejected: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30",
  offer: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30",
};

/** Slightly deeper tint for a column while something is dragged over it — a Trello-style cue
 * that this is a valid drop target, on top of the placeholder @hello-pangea/dnd inserts to
 * reserve the dragged card's space (no layout jump while dragging). */
const STATUS_COLUMN_OVER_STYLES: Record<ApplicationStatus, string> = {
  saved: "bg-slate-100 dark:bg-slate-700/50",
  applied: "bg-sky-100 dark:bg-sky-900/40",
  interview: "bg-amber-100 dark:bg-amber-900/40",
  rejected: "bg-red-100 dark:bg-red-900/40",
  offer: "bg-emerald-100 dark:bg-emerald-900/40",
};

function ApplicationCard({
  app,
  index,
  pt,
}: {
  app: SavedApplication;
  index: number;
  pt: boolean;
}) {
  const removeApplication = useApplicationsStore((s) => s.removeApplication);
  const setJobDescription = useResumeStore((s) => s.setJobDescription);
  const router = useRouter();
  const locale = pt ? "pt-br" : "en";

  function compareWithResume() {
    setJobDescription(app.description ?? "");
    router.push("/builder?tab=job");
  }

  return (
    <Draggable draggableId={app.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={
            "rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow dark:border-slate-700 dark:bg-slate-900 " +
            (snapshot.isDragging ? "rotate-1 shadow-lg" : "")
          }
        >
          <div className="flex items-start justify-between gap-2">
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              // Dragging (mouse down + move) shouldn't also follow the link — only a plain
              // click should. @hello-pangea/dnd already distinguishes drag from click for us,
              // so no extra handling is needed here beyond normal link behavior.
              className="text-sm font-semibold text-slate-900 hover:underline dark:text-slate-100"
            >
              {app.title}
            </a>
            <button
              type="button"
              onClick={() => removeApplication(app.id)}
              className="shrink-0 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
              aria-label={pt ? "Remover" : "Remove"}
            >
              ×
            </button>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {app.company ? `${app.company} · ` : ""}
            {app.source}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            {pt ? "Salvo" : "Saved"} {relativeTime(app.savedAt, locale)}
          </p>
          <button
            type="button"
            onClick={compareWithResume}
            className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            {pt ? "Comparar com currículo" : "Compare with resume"}
          </button>
        </div>
      )}
    </Draggable>
  );
}

/** Simple funnel counts from the tracker's own data — no extra timestamps are kept per status
 * change, so this reports counts/rates as of right now rather than time-to-interview or similar
 * (that would need a status-change history this app doesn't record). "Response rate" counts
 * anything that moved past "applied" (interview, rejected or offer) over everything that reached
 * "applied" or further — "saved" jobs aren't applications yet, so they're excluded from the rate. */
function ApplicationsStats({ applications, pt }: { applications: SavedApplication[]; pt: boolean }) {
  if (applications.length === 0) return null;

  const counts: Record<ApplicationStatus, number> = {
    saved: 0,
    applied: 0,
    interview: 0,
    rejected: 0,
    offer: 0,
  };
  for (const a of applications) counts[a.status]++;

  const appliedOrBeyond = counts.applied + counts.interview + counts.rejected + counts.offer;
  const responded = counts.interview + counts.rejected + counts.offer;
  const responseRate = appliedOrBeyond > 0 ? Math.round((responded / appliedOrBeyond) * 100) : null;

  return (
    <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{applications.length}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {pt ? "vagas salvas" : "jobs saved"}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{appliedOrBeyond}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {pt ? "candidaturas enviadas" : "applications sent"}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {responseRate === null ? "—" : `${responseRate}%`}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {pt ? "taxa de resposta" : "response rate"}
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/60 dark:bg-emerald-950/30">
        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{counts.offer}</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          {pt ? "ofertas" : "offers"}
        </p>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const locale = useResumeStore((s) => s.locale);
  const pt = locale === "pt-br";
  const applications = useApplicationsStore((s) => s.applications);
  const reorderApplication = useApplicationsStore((s) => s.reorderApplication);

  function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }
    reorderApplication(draggableId, destination.droppableId as ApplicationStatus, destination.index);
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
        <Link href="/feed" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          ← {pt ? "Notícias e vagas" : "News and jobs"}
        </Link>
        <Link
          href="/builder"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          {pt ? "Meu currículo" : "My resume"}
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {pt ? "Minhas candidaturas" : "My applications"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {pt
            ? "Vagas que você salvou no feed, guardadas só no seu navegador (localStorage) — nada é enviado a servidor algum. Arraste um card entre colunas pra mudar o status."
            : "Jobs you saved from the feed, kept only in your browser (localStorage) — nothing is sent to any server. Drag a card between columns to change its status."}
        </p>

        <ApplicationsStats applications={applications} pt={pt} />

        {applications.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {pt
                ? "Nenhuma vaga salva ainda. Volte pro feed e clique em \"Salvar\" num card de vaga."
                : 'No saved jobs yet. Go back to the feed and click "Save" on a job card.'}
            </p>
            <Link
              href="/feed"
              className="mt-3 inline-block rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {pt ? "Ir pro feed" : "Go to the feed"}
            </Link>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
              {APPLICATION_STATUSES.map((status) => {
                const columnApps = applications.filter((a) => a.status === status);
                return (
                  <div
                    key={status}
                    className={"w-72 shrink-0 rounded-lg border p-3 " + STATUS_COLUMN_STYLES[status]}
                  >
                    <h2 className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      {statusLabel(status, pt)}
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        {columnApps.length}
                      </span>
                    </h2>
                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={
                            "min-h-[3rem] space-y-2 rounded-md transition-colors " +
                            (snapshot.isDraggingOver ? STATUS_COLUMN_OVER_STYLES[status] : "")
                          }
                        >
                          {columnApps.map((app, index) => (
                            <ApplicationCard key={app.id} app={app} index={index} pt={pt} />
                          ))}
                          {provided.placeholder}
                          {columnApps.length === 0 && !snapshot.isDraggingOver && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {pt ? "Nada aqui ainda." : "Nothing here yet."}
                            </p>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </main>
    </div>
  );
}
