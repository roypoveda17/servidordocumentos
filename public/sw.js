/* Service worker para instalar SCI como PWA con iconos propios (no Angular). */
const CACHE = 'sci-shell-v5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache
        .addAll([
          '/',
          '/index.html',
          '/manifest.webmanifest',
          '/sci-icon-v4-192.png',
          '/sci-icon-v4-512.png',
          '/sci-icon-v4-maskable-192.png',
          '/sci-icon-v4-maskable-512.png',
          '/favicon.ico',
          '/favicon.svg',
        ])
        .catch(() => undefined)
    )
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Nunca interceptar APIs ni navegaciones cross-origin.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  const isIconOrManifest =
    url.pathname.includes('sci-icon') ||
    url.pathname.includes('favicon') ||
    url.pathname.includes('apple-touch-icon') ||
    url.pathname.endsWith('manifest.webmanifest') ||
    url.pathname.endsWith('/sw.js');

  if (isIconOrManifest) {
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

  // App shell: red primero; si falla, caché.
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Evitar cachear respuestas HTML de fallback para rutas desconocidas como si fueran APIs.
        if (response.ok && request.destination !== '') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
