const CACHE_NAME = 'origami-editor-v1';
const urlsToCache = [
  './', // Root path
  './index.html',
  './manifest.json',
  './src/index.js',
  './src/output.css',
  './src/backend/backend.js',
  './src/backend/data.js',
  './src/backend/dom.js',
  './src/backend/draw.js',
  './src/backend/elements.js',
  './src/backend/geom.js',
  './src/backend/helper.js',
  './src/backend/history.js',
  './src/backend/pubsub.js',
  './src/backend/shortcuts.js',
  './public/logo.svg',
  './public/origami192.png',
  './public/origami512.png',
  './public/draw.svg',
  './public/bisect.svg',
  './public/fold.svg',
  './public/delete.svg',
  './public/suggest.svg',
  './public/success.svg',
  './public/close.svg',
  './public/chevron-up.svg',
  './public/github.svg',
  './public/tutorial.svg',
  './public/survey.svg',
  './public/help-close.svg'
];

// Install event - cache all initial resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache what we can and ignore failures
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn('Failed to cache:', url, err);
            })
          )
        );
      })
  );
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // If fetch fails, return a fallback response if we have one
          return caches.match('./index.html');
        });
      })
  );
});

// Activate event - clean up old caches
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