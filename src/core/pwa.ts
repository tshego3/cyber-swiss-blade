import { el } from './dom';
import { button } from './ui';

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const register = (): void => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(watchForUpdates)
      .catch((error: unknown) => console.warn('Service worker registration failed; the app still works online.', error));
  };
  // start() calls this after async work, so the load event has often fired already.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

function watchForUpdates(registration: ServiceWorkerRegistration): void {
  if (registration.waiting && navigator.serviceWorker.controller) showUpdateBanner(registration);
  registration.addEventListener('updatefound', () => {
    const installing = registration.installing;
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(registration);
    });
  });
}

function showUpdateBanner(registration: ServiceWorkerRegistration): void {
  if (document.querySelector('.update-banner')) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
  document.body.append(
    el('div', { class: 'update-banner', attrs: { role: 'status' } }, [
      el('span', { text: 'A new version is ready.' }),
      button({ label: 'Reload', variant: 'primary', onClick: () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }) }),
    ]),
  );
}
