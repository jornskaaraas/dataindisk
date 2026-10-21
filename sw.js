// DataIndisk service worker: nettverk først for selve siden (alltid nyeste versjon), cache som reserve offline
const CACHE = "dataindisk-v6";
const SHELL = ["./", "index.html", "manifest.json", "icon.svg", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("tile.openstreetmap.org")) return; // kartfliser går rett til OSM
  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    e.respondWith(fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); return res; })
      .catch(() => caches.match(req).then(h => h || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok && (url.origin === self.location.origin || url.hostname.includes("fonts.g") || url.hostname === "cdnjs.cloudflare.com")) {
      const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c));
    }
    return res;
  })));
});
