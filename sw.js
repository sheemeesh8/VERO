// Service Worker for fast page navigation
// Caches all HTML pages and serves them from cache when available

const CACHE_NAME = 'vero-v1';
const PAGES_TO_CACHE = [
  'index.html',
  'profile.html',
  'products.html',
  'drafts.html',
  'seller-area.html',
  'chats.html',
  'expenses.html',
  'offers-received.html',
  'cart.html',
  'cart-store.html',
  'buyer-profile.html',
  'store-profile.html',
  'product.html',
  'product-showcase.html',
  'product-edit.html',
  'product-builder.html',
  'product-demo.html',
  'saved.html',
  'follows.html',
  'dashboard.html',
  'about.html',
  'card-lab.html',
  'card-studio.html',
  'filter-placer.html',
  'onboarding.html',
  'promo-designer.html',
  'promo-studio.html',
  'water-hero.html',
  'phone-frame.html'
];

// Install: cache critical pages on first run
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache a subset of pages immediately (to keep install fast)
      return cache.addAll([
        'index.html',
        'profile.html',
        'products.html',
        'phone-frame.html'
      ]).catch(err => console.log('Initial cache failed:', err));
    })
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  const { request } = event;

  // Only cache HTML files and same-origin requests
  if (!request.url.endsWith('.html') || !request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      // Serve from cache if available, then update cache in background
      if (cached) {
        // Background update: fetch new version and cache it
        fetch(request).then(response => {
          if (response.ok && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, cloned);
            });
          }
        }).catch(() => {}); // ignore network errors, we have the cached version
        return cached;
      }

      // No cache, fetch from network
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        // Cache successful responses
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, cloned);
        });
        return response;
      }).catch(() => {
        // Network failed and no cache - return offline page if available
        return caches.match('index.html');
      });
    })
  );
});
