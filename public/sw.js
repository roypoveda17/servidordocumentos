/* Service worker SCI build 7 — network-first, iconos nuevos sci-brand-7. */
const CACHE = 'sci-shell-build-7';
const PRECACHE = [
  '/manifest.webmanifest',
  '/sci-brand-7-192.png',
  '/sci-brand-7-512.png',
  '/sci-brand-7-maskable-192.png',
  '/sci-brand-7-maskable-512.png',
  '/favicon.ico',
  '/favicon.svg',
  '/version.json',
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
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  const isNavigation = request.mode === 'navigate' || request.destination === 'document';
  const isHtml = url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname === '/index.html';
  const isMeta =
    url.pathname.endsWith('/sw.js') ||
    url.pathname.includes('manifest.webmanifest') ||
    url.pathname.endsWith('/version.json');

  if (isNavigation || isHtml || isMeta) {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }

  const isIcon =
    url.pathname.includes('sci-brand-7') ||
    url.pathname.includes('sci-icon') ||
    url.pathname.includes('favicon') ||
    url.pathname.includes('apple-touch-icon');

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && isIcon) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
