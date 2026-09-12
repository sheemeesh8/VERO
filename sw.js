/* moravchick service worker — CACHE DISABLED.
 *
 * This worker deletes every cache and does NOT cache anything: it registers no
 * fetch handler, so every request goes straight to the network and the app is
 * always the freshest deploy. It exists only to purge the caches that earlier
 * versions of this worker created on clients, and to keep those clients from
 * ever serving stale content again.
 *
 * Bump CACHE_VERSION to push a fresh copy of this worker to all clients.
 */
var CACHE_VERSION = 'vero-v149';

self.addEventListener('install', function () {
  // Take over immediately, without waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      // Delete EVERY cache, not just old versions — a full purge.
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () {
      // Control all open pages so the next navigation is network-fresh.
      return self.clients.claim();
    })
  );
});

/* No 'fetch' handler on purpose: the worker never intercepts requests, so
   nothing is stored in the Cache Storage and the browser always fetches from
   the network. */
