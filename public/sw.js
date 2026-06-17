const CACHE_NAME = "homex-pwa-v1";
const OFFLINE_URL = "/offline.html";
const CORE_ASSETS = [OFFLINE_URL, "/favicon.png", "/homex-logo.png", "/manifest.webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).catch(() => cached))
  );
});

self.addEventListener("push", event => {
  let payload = { title: "HOMEX reminder", body: "A care-circle reminder is due.", url: "/dashboard/reminders" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/homex-logo.png",
      badge: "/favicon.png",
      data: { url: payload.url || "/dashboard/reminders" }
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard/reminders";
  event.waitUntil(clients.openWindow(url));
});
