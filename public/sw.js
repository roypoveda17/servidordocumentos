/* Service worker SCI — network-first para que los deploys se vean al instante. */
const CACHE = 'sci-shell-v6';
const PRECACHE = [
  '/manifest.webmanifest',
  '/sci-icon-v4-192.png',
  '/sci-icon-v4-512.png',
  '/sci-icon-v4-maskable-192.png',
  '/sci-icon-v4-maskable-512.png',
  '/favicon.ico',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  const isNavigation = request.mode === 'navigate' || request.destination === 'document';
  const isHtml = url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname === '/index.html';
  const isSwOrManifest =
    url.pathname.endsWith('/sw.js') ||
    url.pathname.endsWith('manifest.webmanifest') ||
    url.pathname.endsWith('.webmanifest');
  const isIcon =
    url.pathname.includes('sci-icon') ||
    url.pathname.includes('favicon') ||
    url.pathname.includes('apple-touch-icon');

  // HTML / navegación / SW / manifest: siempre red, sin cachear HTML viejo.
  if (isNavigation || isHtml || isSwOrManifest) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (isIcon) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // JS/CSS hasheados: red primero, caché solo como respaldo offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
