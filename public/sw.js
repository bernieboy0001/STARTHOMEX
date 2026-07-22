const CACHE = "homex-static-v1";
const STATIC_ASSETS = ["/homex-logo.png", "/favicon.png", "/manifest.webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("homex-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !STATIC_ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});

self.addEventListener("push", event => {
  const data = event.data?.json?.() || {};
  event.waitUntil(self.registration.showNotification(data.title || "HOMEX reminder", {
    body: data.body || "There is an update in your care circle.",
    icon: "/favicon.png",
    badge: "/favicon.png",
    data: { url: data.url || "/dashboard/reminders" }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/dashboard"));
});
