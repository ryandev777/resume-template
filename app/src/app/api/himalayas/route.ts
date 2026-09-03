import { NextResponse } from "next/server";

/**
 * Thin server-side proxy for the Himalayas jobs API (https://himalayas.app/docs/remote-jobs-api).
 * Needed because that API doesn't send `Access-Control-Allow-Origin` — confirmed by both
 * `curl -I` and an actual cross-origin `fetch()` from the browser (fails with a CORS error),
 * unlike every other source this app talks to. Runs as a Next.js Route Handler, which is a
 * free Vercel serverless function on the free tier — no new cost, no API key.
 *
 * Deliberately narrow: only forwards the two params the feed actually uses (`country`, `page`),
 * not an open passthrough to the upstream API.
 */
const HIMALAYAS_SEARCH_URL = "https://himalayas.app/jobs/api/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");
  const page = searchParams.get("page") ?? "1";

  const upstream = new URL(HIMALAYAS_SEARCH_URL);
  if (country) upstream.searchParams.set("country", country);
  upstream.searchParams.set("page", page);

  try {
    const res = await fetch(upstream, { next: { revalidate: 300 } });
    if (!res.ok) {
      return NextResponse.json({ error: `Himalayas respondeu ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Falha ao contatar a Himalayas API" }, { status: 502 });
  }
}
