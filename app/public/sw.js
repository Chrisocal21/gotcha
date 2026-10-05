// Gotcha service worker: lets the app install and open instantly, and keeps the shell available offline.
// Never touches /api (catches and cards always come live) and always asks the network for the page first,
// so a new deploy shows up on the next open.
const VERSION = "gotcha-shell-v1";
const SHELL = ["/", "/favicon.svg", "/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Pages: network first, the saved copy when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  // Built files have a new name whenever they change, so a saved copy is always right. Everything else is
  // served from the saved copy while it refreshes in the background.
  const hashed = url.pathname.startsWith("/assets/");
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit && hashed) return hit;
      const fresh = fetch(req).then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      });
      if (!hit) return fresh;
      fresh.catch(() => {});
      return hit;
    }),
  );
});
