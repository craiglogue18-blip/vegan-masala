const CACHE_VERSION = "vegan-masala-app-v1";
const APP_CACHE = `${CACHE_VERSION}-pages`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const APP_ROUTES = ["/meal-planner", "/meal-planner/build", "/meal-planner/shopping", "/meal-planner/welcome"];
const CORE_ASSETS = [
  "/offline.html",
  "/site.webmanifest",
  "/brand/logo-mark.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(ASSET_CACHE).then((cache) => Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url)))),
      caches.open(APP_CACHE).then((cache) => Promise.allSettled(APP_ROUTES.map((url) => cache.add(url)))),
    ])
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("vegan-masala-app-") && !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isPlannerPage = url.pathname.startsWith("/meal-planner");
  const isAppAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/_next/image") || url.pathname.startsWith("/brand/") || url.pathname.startsWith("/images/") || url.pathname.startsWith("/fonts/");

  if (request.mode === "navigate" && isPlannerPage) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(APP_CACHE).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/meal-planner")) || caches.match("/offline.html"))
    );
    return;
  }

  if (isAppAsset) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) caches.open(ASSET_CACHE).then((cache) => cache.put(request, response.clone()));
        return response;
      }))
    );
  }
});
