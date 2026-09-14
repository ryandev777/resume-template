import {
  FONT_SCALE_MIN,
  FONT_SCALE_MAX,
  type Entry,
  type EducationEntry,
  type ProjectEntry,
  type PersonalInfo,
  type ResumeData,
} from "./types";

/** Encoded fragments longer than this get rejected before a link is ever shown — comfortably
 * below the ~64k+ limits most browsers/address bars tolerate, but a resume this size is almost
 * certainly better served by the PDF or the .json backup anyway. */
export const MAX_SHARE_LINK_LENGTH = 7000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function compressText(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

/** Hard cap on decompressed size — a real resume's JSON is a few KB at most, so this is wildly
 * generous for anything legitimate. It exists purely to stop a decompression-bomb link: gzip
 * gets ~1000x ratios on repetitive input, so even a hand-crafted payload well under
 * MAX_SHARE_LINK_LENGTH can decompress to many MB. Read as a stream and abort as soon as this
 * is crossed, rather than letting Response.arrayBuffer() buffer the whole thing first. */
const MAX_DECOMPRESSED_BYTES = 2 * 1024 * 1024;

async function decompressBytes(bytes: Uint8Array): Promise<string> {
  // Cast needed because TS's DOM lib types Blob's BlobPart as requiring an ArrayBuffer-backed
  // view specifically, while Uint8Array is typed generically over ArrayBufferLike — this
  // Uint8Array is always a fresh one backed by a real ArrayBuffer (from base64UrlToBytes), so
  // the mismatch is a lib typing gap, not an actual runtime risk.
  const stream = new Blob([bytes as unknown as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_DECOMPRESSED_BYTES) {
        throw new Error("decompressed payload exceeds the allowed size");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buf);
}

export type BuildShareUrlResult = { url: string } | { error: "unsupported" | "too-large" };

/** Compresses+encodes the resume into a #d=<data> fragment link — the fragment is never sent to
 * any server (unlike a query string), so this works with zero backend and shows up in no log. */
export async function buildShareUrl(
  data: ResumeData,
  opts: { includeContact: boolean },
): Promise<BuildShareUrlResult> {
  if (typeof CompressionStream === "undefined") return { error: "unsupported" };

  const payload: ResumeData = opts.includeContact
    ? data
    : { ...data, personal: { ...data.personal, email: "", phone: "" } };

  const compressed = await compressText(JSON.stringify(payload));
  const encoded = bytesToBase64Url(compressed);
  if (encoded.length > MAX_SHARE_LINK_LENGTH) return { error: "too-large" };

  return { url: `${window.location.origin}/compartilhar#d=${encoded}` };
}

/** Reverses buildShareUrl from a raw `location.hash` (e.g. "#d=H4sI..."). Returns null for
 * anything that doesn't decode/parse cleanly — same tolerant "is it a plausible object" check
 * used for the JSON backup import, not a strict schema validator. */
export async function decodeSharedResume(hash: string): Promise<Partial<ResumeData> | null> {
  const match = /(?:^#|[?&])d=([^&]+)/.exec(hash);
  if (!match) return null;
  // Cheap early reject for an obviously-oversized fragment, before touching base64/gzip at
  // all — this alone does NOT stop a decompression bomb (a malicious payload well under this
  // length can still gzip-expand to many MB), that's what MAX_DECOMPRESSED_BYTES above is for.
  if (match[1].length > MAX_SHARE_LINK_LENGTH) return null;
  try {
    const json = await decompressBytes(base64UrlToBytes(match[1]));
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Partial<ResumeData>;
  } catch {
    return null;
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function bool(v: unknown): boolean {
  return typeof v === "boolean" ? v : false;
}

function fontScale(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v)
    ? Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, v))
    : 1;
}

function syntheticId(raw: unknown, prefix: string, i: number): string {
  return typeof raw === "string" && raw ? raw : `${prefix}-${i}`;
}

function hydrateEntries(items: unknown, prefix: string): Entry[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw, i) => {
    const item = (raw ?? {}) as Partial<Entry>;
    return {
      id: syntheticId(item.id, prefix, i),
      org: str(item.org),
      location: str(item.location),
      role: str(item.role),
      startDate: str(item.startDate),
      endDate: str(item.endDate),
      current: bool(item.current),
      bullets: Array.isArray(item.bullets) ? item.bullets.filter((b) => typeof b === "string") : [],
    };
  });
}

function hydrateEducation(items: unknown): EducationEntry[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw, i) => {
    const item = (raw ?? {}) as Partial<EducationEntry>;
    return {
      id: syntheticId(item.id, "edu", i),
      institution: str(item.institution),
      location: str(item.location),
      degree: str(item.degree),
      startDate: str(item.startDate),
      endDate: str(item.endDate),
    };
  });
}

function hydrateProjects(items: unknown): ProjectEntry[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw, i) => {
    const item = (raw ?? {}) as Partial<ProjectEntry>;
    return {
      id: syntheticId(item.id, "proj", i),
      name: str(item.name),
      link: str(item.link),
      linkText: str(item.linkText),
      description: str(item.description),
    };
  });
}

/** Fills in every field a decoded (possibly partial/older-shape) shared payload might be
 * missing, so ResumeDocument can render it read-only without needing its own null-checks —
 * mirrors what the store's `loadData` merge does for JSON-backup import, just producing a full
 * ResumeData object instead of patching store state. */
export function hydrateSharedResume(partial: Partial<ResumeData>): ResumeData {
  const p = (partial.personal ?? {}) as Partial<PersonalInfo>;
  return {
    locale: partial.locale === "en" ? "en" : "pt-br",
    studentMode: bool(partial.studentMode),
    fontScale: fontScale(partial.fontScale),
    personal: {
      fullName: str(p.fullName),
      headline: str(p.headline),
      location: str(p.location),
      email: str(p.email),
      phone: str(p.phone),
      linkedin: str(p.linkedin),
      linkedinText: str(p.linkedinText),
      github: str(p.github),
      githubText: str(p.githubText),
      website: str(p.website),
      websiteText: str(p.websiteText),
    },
    summary: str(partial.summary),
    experiences: hydrateEntries(partial.experiences, "exp"),
    leadership: hydrateEntries(partial.leadership, "lead"),
    education: hydrateEducation(partial.education),
    projects: hydrateProjects(partial.projects),
    skills: {
      technical: str(partial.skills?.technical),
      languages: str(partial.skills?.languages),
    },
    jobDescription: str(partial.jobDescription),
  };
}
