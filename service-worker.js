const cacheName = 'calculator-app-cache-v1';
const filesToCache = [
  '/',
  '/index.html',
  '/calculator.js',
  '/calculator.css',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName)
      .then((cache) => {
        console.log('Caching files');
        return cache.addAll(filesToCache);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [cacheName];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (!cacheWhitelist.includes(cache)) {
              return caches.delete(cache);
            }
          })
        );
      })
  );
});

// Fetch from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
  );
});
