/** Minimal, dependency-free service worker — this app has no backend and already keeps all its
 * data client-side, so the only thing worth doing offline is serving the app shell (pages +
 * hashed static assets) that's already been visited once. No precache manifest tooling (like
 * next-pwa/Workbox): those hook into webpack's build graph, which doesn't line up with this
 * project's Turbopack build, so a hand-rolled worker is the simpler and more reliable option
 * here. Bump CACHE_VERSION on any change to this file so old clients pick up the new logic. */
const CACHE_VERSION = "v1";
const CACHE_NAME = `resume-template-${CACHE_VERSION}`;
const APP_SHELL = ["/", "/builder", "/feed", "/feed/candidaturas", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {})),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Cross-origin requests (GitHub API, RSS/job feed sources, etc.) are left untouched — this
  // worker only ever caches the app's own shell, never third-party or dynamic feed data.
  if (url.origin !== self.location.origin) return;

  // Next.js's hashed build assets never change contents under the same URL, so cache-first is
  // safe and avoids a network round-trip on every load.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Everything else same-origin (pages, manifest, our own /api routes): always prefer a fresh
  // network response, only falling back to whatever's cached (or the shell) when offline — so
  // the app still opens without a connection, but never serves stale content while online.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
  );
});
