import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

const SW_VERSION = 'v6';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${SW_VERSION}`)
      .then((reg) => {
        reg.update().catch(() => undefined);
        if (reg.waiting) {
          reg.waiting.postMessage('SKIP_WAITING');
        }
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch((err) => {
        console.warn('No se pudo registrar el service worker de SCI:', err);
      });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Recarga una sola vez cuando hay un SW nuevo para mostrar el deploy.
      const key = `sci-sw-reloaded-${SW_VERSION}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
    });
  });
}
