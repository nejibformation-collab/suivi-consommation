const CACHE_NAME = "consommation-cache-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try to fetch the latest file; only use the cached
// copy when there is no network connection (true offline fallback).
// Only same-origin GET requests (our own app files) go through the cache —
// API calls to Supabase (or anywhere else) are passed straight through.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const isSameOrigin = new URL(req.url).origin === self.location.origin;

  if (req.method !== "GET" || !isSameOrigin) {
    return; // let the browser handle it normally, no interception
  }

  event.respondWith(
    fetch(req)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return response;
      })
      .catch(() => caches.match(req))
  );
});
