"use client";

import type { Entry, EducationEntry, ProjectEntry } from "@/lib/types";
import { content } from "@/lib/content";
import { useResumeStore } from "@/lib/store";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1 border-b border-slate-800 pb-0.5 text-[13px] font-bold uppercase tracking-wide text-slate-900">
      {children}
    </h2>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  return (
    <div className="mb-2">
      <div className="flex items-baseline justify-between text-[11.5px]">
        <span className="font-bold text-slate-900">{entry.org}</span>
        <span className="text-slate-700">{entry.location}</span>
      </div>
      <div className="flex items-baseline justify-between text-[11px] italic text-slate-700">
        <span>{entry.role}</span>
        <span>
          {entry.startDate}
          {entry.startDate || entry.endDate ? " – " : ""}
          {entry.endDate}
        </span>
      </div>
      {entry.bullets.filter(Boolean).length > 0 && (
        <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[11px] text-slate-800">
          {entry.bullets.filter(Boolean).map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EducationRow({ entry }: { entry: EducationEntry }) {
  return (
    <div className="mb-2">
      <div className="flex items-baseline justify-between text-[11.5px]">
        <span className="font-bold text-slate-900">{entry.institution}</span>
        <span className="text-slate-700">{entry.location}</span>
      </div>
      <div className="flex items-baseline justify-between text-[11px] italic text-slate-700">
        <span>{entry.degree}</span>
        <span>
          {entry.startDate}
          {entry.startDate || entry.endDate ? " – " : ""}
          {entry.endDate}
        </span>
      </div>
    </div>
  );
}

function ProjectRow({ entry }: { entry: ProjectEntry }) {
  return (
    <div className="mb-1.5 text-[11px] text-slate-800">
      <span className="font-bold text-slate-900">{entry.name}</span>
      {entry.link && <span className="text-slate-600"> — {entry.link}</span>}
      {entry.description && <p className="text-slate-700">{entry.description}</p>}
    </div>
  );
}

export function ResumeDocument({ printable = false }: { printable?: boolean }) {
  const state = useResumeStore((s) => s);
  const t = content[state.locale];

  const experiences = state.experiences.filter((e) => e.org.trim());
  const leadership = state.leadership.filter((e) => e.org.trim());
  const education = state.education.filter((e) => e.institution.trim());
  const projects = state.projects.filter((p) => p.name.trim());

  const contactParts = [
    state.personal.location,
    state.personal.email,
    state.personal.phone,
    state.personal.linkedin,
    state.personal.github,
    state.personal.website,
  ].filter(Boolean);

  const educationBlock = education.length > 0 && (
    <section className="mb-3">
      <SectionTitle>{t.sectionTitles.education}</SectionTitle>
      {education.map((e) => (
        <EducationRow key={e.id} entry={e} />
      ))}
    </section>
  );

  return (
    <div
      id={printable ? "resume-print-area" : undefined}
      className="mx-auto w-full max-w-[210mm] bg-white px-10 py-8 text-slate-900 print:w-[210mm] print:px-[15mm] print:py-[15mm] print:shadow-none"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold">
          {state.personal.fullName || (state.locale === "pt-br" ? "Nome Completo" : "Full Name")}
        </h1>
        <p className="mt-0.5 text-[11px] text-slate-700">
          {contactParts.length > 0 ? contactParts.join("  •  ") : ""}
        </p>
      </div>

      {state.summary && (
        <section className="mb-3">
          <p className="text-[11.5px] text-slate-800">{state.summary}</p>
        </section>
      )}

      {state.studentMode && educationBlock}

      {experiences.length > 0 && (
        <section className="mb-3">
          <SectionTitle>{t.sectionTitles.experience}</SectionTitle>
          {experiences.map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        </section>
      )}

      {leadership.length > 0 && (
        <section className="mb-3">
          <SectionTitle>{t.sectionTitles.leadership}</SectionTitle>
          {leadership.map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section className="mb-3">
          <SectionTitle>{t.sectionTitles.projects}</SectionTitle>
          {projects.map((p) => (
            <ProjectRow key={p.id} entry={p} />
          ))}
        </section>
      )}

      {(state.skills.technical || state.skills.languages) && (
        <section className="mb-3">
          <SectionTitle>{t.sectionTitles.skills}</SectionTitle>
          {state.skills.technical && (
            <p className="text-[11px] text-slate-800">
              <span className="font-bold">
                {state.locale === "pt-br" ? "Técnicas: " : "Technical: "}
              </span>
              {state.skills.technical}
            </p>
          )}
          {state.skills.languages && (
            <p className="text-[11px] text-slate-800">
              <span className="font-bold">{t.labels.languages}: </span>
              {state.skills.languages}
            </p>
          )}
        </section>
      )}

      {!state.studentMode && educationBlock}
    </div>
  );
}
