"use client";

import type { Entry, EducationEntry, ProjectEntry, ResumeData } from "@/lib/types";
import { content } from "@/lib/content";
import { useResumeStore } from "@/lib/store";

/** linkedin/github/website are stored as typed (e.g. "linkedin.com/in/user", no protocol) — add
 * one if missing so the link actually navigates instead of being treated as a relative path. */
function ensureProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

interface ContactItem {
  text: string;
  href?: string;
}

function ContactLine({ parts }: { parts: ContactItem[] }) {
  return (
    <p className="mt-0.5 text-[11px] text-slate-700">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && "  •  "}
          {part.href ? (
            <a
              href={part.href}
              target={part.href.startsWith("http") ? "_blank" : undefined}
              rel={part.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-slate-700 no-underline hover:underline"
            >
              {part.text}
            </a>
          ) : (
            part.text
          )}
        </span>
      ))}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1 border-b border-slate-800 pb-0.5 text-[13px] font-bold uppercase tracking-wide text-slate-900">
      {children}
    </h2>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  return (
    <div className="mb-2 break-inside-avoid">
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
    <div className="mb-2 break-inside-avoid">
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
    <div className="mb-1.5 break-inside-avoid text-[11px] text-slate-800">
      <span className="font-bold text-slate-900">{entry.name}</span>
      {entry.link && <span className="text-slate-600"> — {entry.link}</span>}
      {entry.description && (
        <p className="whitespace-pre-line text-slate-700">{entry.description}</p>
      )}
    </div>
  );
}

export function ResumeDocument({
  printable = false,
  data,
}: {
  printable?: boolean;
  /** Renders this data instead of the local store — used by /compartilhar to show a shared
   * link's resume read-only, without ever writing it into this viewer's own store/localStorage. */
  data?: ResumeData;
}) {
  const store = useResumeStore((s) => s);
  const state = data ?? store;
  const t = content[state.locale];

  const experiences = state.experiences.filter((e) => e.org.trim());
  const leadership = state.leadership.filter((e) => e.org.trim());
  const education = state.education.filter((e) => e.institution.trim());
  const projects = state.projects.filter((p) => p.name.trim());

  const contactParts: ContactItem[] = [
    state.personal.location ? { text: state.personal.location } : null,
    state.personal.email
      ? { text: state.personal.email, href: `mailto:${state.personal.email}` }
      : null,
    state.personal.phone
      ? { text: state.personal.phone, href: `tel:${state.personal.phone.replace(/[^\d+]/g, "")}` }
      : null,
    state.personal.linkedin
      ? { text: state.personal.linkedin, href: ensureProtocol(state.personal.linkedin) }
      : null,
    state.personal.github
      ? { text: state.personal.github, href: ensureProtocol(state.personal.github) }
      : null,
    state.personal.website
      ? { text: state.personal.website, href: ensureProtocol(state.personal.website) }
      : null,
  ].filter((p): p is ContactItem => p !== null);

  const educationBlock = education.length > 0 && (
    <section className="mb-3">
      <SectionTitle>{t.sectionTitles.education}</SectionTitle>
      {education.map((e) => (
        <EducationRow key={e.id} entry={e} />
      ))}
    </section>
  );

  return (
    // Intentionally no dark: classes anywhere in this component — the resume is a page of
    // paper, not site chrome, and must look the same (white background, dark text) whether the
    // app is in light or dark mode, both on screen and on the printed/exported PDF. The
    // print:bg-white/text-slate-900 below plus the #resume-print-area override in globals.css
    // are belt-and-suspenders against a dark ancestor ever bleeding through at print time.
    <div
      id={printable ? "resume-print-area" : undefined}
      className="mx-auto w-full max-w-[210mm] bg-white px-10 py-8 text-slate-900 print:w-[210mm] print:bg-white print:px-[15mm] print:py-[15mm] print:text-slate-900 print:shadow-none"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold">
          {state.personal.fullName || (state.locale === "pt-br" ? "Nome Completo" : "Full Name")}
        </h1>
        {state.personal.headline && (
          <p className="mt-0.5 text-[12px] text-slate-800">{state.personal.headline}</p>
        )}
        {contactParts.length > 0 && <ContactLine parts={contactParts} />}
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
