// AGRICHAIN 360 - Service Worker for Offline Support

const CACHE_NAME = 'agrichain360-v1';
const urlsToCache = [
  '/',
  '/marketplace',
  '/login',
  '/signup',
  '/farmer-dashboard',
  '/buyer-dashboard',
  '/my-sales',
  '/my-listings',
  '/order-history',
  '/pricing',
  '/roles',
  '/css/main.css',
  '/js/app.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch from Cache (Offline Support)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});