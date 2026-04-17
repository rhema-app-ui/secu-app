const CACHE_NAME = "secu-app-pwa-v1";
const CORE_ASSETS = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(CORE_ASSETS)));
});

self.addEventListener("fetch", (e) => {
  // Ignore les requêtes Supabase/Stripe (elles doivent rester online)
  if (e.request.url.includes("supabase") || e.request.url.includes("stripe")) return;
  
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});