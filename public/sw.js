// public/sw.js — caches the app shell + map tiles + photos for offline use.
// Registered by /src/components/RegisterSW.tsx on the home page.

const VERSION = "v66";
const APP_SHELL = `falls-app-${VERSION}`;
const RUNTIME = `falls-runtime-${VERSION}`;
const TILES = `falls-tiles-${VERSION}`;
const IMAGES = `falls-images-${VERSION}`;

const SHELL_URLS = ["/", "/map", "/cabins", "/trails", "/manual", "/memories", "/manifest.webmanifest", "/logo-round.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.addAll(SHELL_URLS).catch(() => {})),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => ![APP_SHELL, RUNTIME, TILES, IMAGES].includes(k)).map((k) => caches.delete(k)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Map tiles — stale-while-revalidate, capped at TILES cache
  if (url.host.endsWith("tile.opentopomap.org") || url.host.endsWith("basemap.nationalmap.gov") || url.host.endsWith("basemaps.cartocdn.com") || url.host.endsWith("openstreetmap.org") || url.host.endsWith("arcgisonline.com")) {
    event.respondWith(staleWhileRevalidate(TILES, req));
    return;
  }
  // Cabin photos from Hostaway CDN — cache aggressively
  if (url.host.endsWith("bookingenginecdn.hostaway.com")) {
    event.respondWith(cacheFirst(IMAGES, req));
    return;
  }
  // Same-origin: app shell + runtime
  if (url.origin === self.location.origin) {
    // Navigations (HTML pages) — try network, fall back to cached shell
    if (req.mode === "navigate") {
      event.respondWith(networkFirstNavigation(req));
      return;
    }
    // Static assets (Next.js _next chunks, JSON, images) — stale-while-revalidate
    event.respondWith(staleWhileRevalidate(RUNTIME, req));
    return;
  }
});

async function networkFirstNavigation(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(APP_SHELL);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(req) || await caches.match("/");
    return cached || new Response("Offline — page not yet cached.", { status: 503 });
  }
}

async function staleWhileRevalidate(cacheName, req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fresh = fetch(req).then((res) => {
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  }).catch(() => undefined);
  return cached || (await fresh) || new Response("offline", { status: 503 });
}

async function cacheFirst(cacheName, req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const fresh = await fetch(req).catch(() => undefined);
  if (fresh && fresh.status === 200) cache.put(req, fresh.clone());
  return fresh || new Response("offline", { status: 503 });
}
