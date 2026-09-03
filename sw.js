/* moravchick service worker — makes the installed app fast.
 *
 * Strategy:
 *  - HTML documents (navigations / *.html): NETWORK-FIRST, so the app always
 *    shows the freshest deploy; fall back to cache only when offline.
 *  - Static assets (images, css, js, fonts): STALE-WHILE-REVALIDATE — served
 *    instantly from the cache while a fresh copy is fetched in the background
 *    for next time. This is what removes the slow re-download of the heavy
 *    hero images on every open.
 *
 * Bump CACHE_VERSION to force all clients onto a clean cache.
 */
var CACHE_VERSION = 'vero-v22';
var ASSET_CACHE = CACHE_VERSION + '-assets';
var HTML_CACHE = CACHE_VERSION + '-html';

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      // Drop any cache that isn't from the current version.
      return Promise.all(keys.map(function (k) {
        if (k.indexOf(CACHE_VERSION) !== 0) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isHTML(req, url) {
  return req.mode === 'navigate' ||
         req.destination === 'document' ||
         /\.html($|\?)/.test(url.pathname + url.search);
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  // Only handle our own origin; let cross-origin (fonts CDNs, etc.) pass through.
  if (url.origin !== self.location.origin) return;

  // ---- HTML: network-first (fresh), cache fallback for offline ----
  if (isHTML(req, url)) {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(HTML_CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('phone-frame.html') || caches.match('index.html');
        });
      })
    );
    return;
  }

  // ---- Static assets: stale-while-revalidate (instant, updates in bg) ----
  event.respondWith(
    caches.open(ASSET_CACHE).then(function (cache) {
      return cache.match(req).then(function (hit) {
        var network = fetch(req).then(function (res) {
          // Only cache complete, successful, basic responses.
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(req, res.clone());
          }
          return res;
        }).catch(function () { return hit; });
        // Serve cached copy immediately if we have it; otherwise wait for network.
        return hit || network;
      });
    })
  );
});
