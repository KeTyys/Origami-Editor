const CACHE_NAME = 'origami-editor-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/backend/backend.js',
  '/src/backend/data.js',
  '/src/backend/dom.js',
  '/src/backend/draw.js',
  '/src/backend/elements.js',
  '/src/backend/geom.js',
  '/src/backend/helper.js',
  '/src/backend/history.js',
  '/src/backend/pubsub.js',
  '/src/backend/shortcuts.js',
  // Add other important assets, CSS files, images etc.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

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