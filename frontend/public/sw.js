const CACHE = 'snkrs-cart-v1';

const PRECACHE = [
  '/',
  '/products',
  '/manifest.json',
  '/logo.png',
  '/icon1.png',
];

// Install — precache shell pages
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate — delete old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', (e) => {
  // Only handle GET requests for same-origin or static assets
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Skip API, analytics, external requests
  if (
    url.pathname.startsWith('/api/') ||
    !['https://snkrscart.com', self.location.origin].includes(url.origin)
  ) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache a clone of successful responses for static assets & pages
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
