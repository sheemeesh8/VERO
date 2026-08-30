/* VERO service worker — minimal, network-first pass-through.
   Its job is to make the site installable as a standalone app.
   The site intentionally revalidates on every load (see serve.json /
   phone-frame cache headers), so we do NOT cache the shell here —
   we just forward requests to the network so installs stay fresh. */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  // Pure pass-through: always go to the network.
  event.respondWith(fetch(event.request));
});
