// Minimal service worker -- required for PWA installability (Add to Home Screen /
// TWA-wrapped APK via PWABuilder/Bubblewrap). Network-first for HTML/API so live
// signals/prices are never served stale; cache-first for static assets/icons only.
// Also handles Web Push (real OS/browser notifications for new signals).
const CACHE = "qco2-shell-v1";
const SHELL_ASSETS = ["/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isStaticAsset = url.pathname.startsWith("/icons/") || url.pathname.endsWith(".png") || url.pathname.endsWith(".svg");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, clone));
        return res;
      }))
    );
    return;
  }

  // Everything else (pages, /api/* including live prices/signals): always go to
  // network, never cache -- this app is real-time by design (5s SWR polling etc).
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});

// ---- Web Push ----
self.addEventListener("push", (event) => {
  let data = { title: "LASTQUESTION.CO", body: "Ada update baru.", url: "/dashboard" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // ignore malformed payloads
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "qco2-signal",
      data: { url: data.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url.includes(targetUrl) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
