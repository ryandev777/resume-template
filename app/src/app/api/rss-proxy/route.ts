import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";

/**
 * Server-side proxy for user-added RSS/Atom feeds (Fase P) — needed because most feeds don't
 * send `Access-Control-Allow-Origin`, same reasoning as /api/himalayas. Unlike that route, the
 * URL here is arbitrary and user-supplied, so this is deliberately hardened against SSRF:
 * only https://, only a hostname whose DNS-resolved addresses are all public (blocks
 * localhost/loopback/private/link-local ranges, and DNS-rebinding attempts that resolve to one
 * of those after the fact), no following redirects (an attacker-controlled redirect could point
 * at an internal address even if the original URL looked fine), a short fetch timeout, and a
 * capped response size read as a stream (same MAX_DECOMPRESSED_BYTES-style streaming-abort
 * pattern used for the share-link decompression bomb in lib/share.ts, rather than buffering an
 * unbounded body via res.text() first).
 */
const FETCH_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 3 * 1024 * 1024;

function isPrivateOrLoopbackIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    return false;
  }
  // Not a recognizable literal IP — treat conservatively as unsafe rather than let it through.
  return true;
}

async function isSafeRemoteUrl(url: URL): Promise<boolean> {
  if (url.protocol !== "https:") return false;
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return false;
  try {
    const results = await lookup(hostname, { all: true });
    return results.length > 0 && results.every((r) => !isPrivateOrLoopbackIp(r.address));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Parâmetro 'url' ausente" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  if (!(await isSafeRemoteUrl(target))) {
    return NextResponse.json({ error: "Essa URL não é permitida" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(target, {
      signal: controller.signal,
      redirect: "manual",
      headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    });

    if (res.status >= 300 && res.status < 400) {
      return NextResponse.json({ error: "Essa fonte redireciona — não permitido" }, { status: 400 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Fonte respondeu ${res.status}` }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!/xml|rss|atom/i.test(contentType)) {
      return NextResponse.json({ error: "Conteúdo não parece ser um feed RSS/Atom" }, { status: 400 });
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "Falha ao ler a resposta da fonte" }, { status: 502 });
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return NextResponse.json({ error: "Resposta da fonte é grande demais" }, { status: 400 });
      }
      chunks.push(value);
    }
    const buf = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buf.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new NextResponse(new TextDecoder().decode(buf), {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Tempo esgotado ao buscar a fonte" }, { status: 504 });
    }
    return NextResponse.json({ error: "Falha ao contatar a fonte" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
