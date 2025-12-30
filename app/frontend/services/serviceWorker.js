/**
 * Service Worker Registration
 * Handles PWA functionality including caching and offline support
 */

const SW_URL = '/sw.js';

// Check if service workers are supported
export function isServiceWorkerSupported() {
  return 'serviceWorker' in navigator;
}

// Register the service worker
export async function registerServiceWorker() {
  if (!isServiceWorkerSupported()) {
    console.log('CoCoスモ: Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/'
    });

    console.log('CoCoスモ: Service Worker registered successfully');

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content is available
          console.log('CoCoスモ: New content available, refresh to update');
          dispatchUpdateEvent();
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('CoCoスモ: Service Worker registration failed:', error);
    return null;
  }
}

// Unregister the service worker
export async function unregisterServiceWorker() {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    console.log('CoCoスモ: Service Worker unregistered');
    return result;
  } catch (error) {
    console.error('CoCoスモ: Service Worker unregistration failed:', error);
    return false;
  }
}

// Skip waiting and activate new service worker
export async function skipWaiting() {
  if (!isServiceWorkerSupported()) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

// Request specific URLs to be cached
export async function cacheUrls(urls) {
  if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) {
    return;
  }

  navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_URLS',
    payload: urls
  });
}

// Dispatch custom event for app update notification
function dispatchUpdateEvent() {
  const event = new CustomEvent('swUpdate', {
    detail: { hasUpdate: true }
  });
  window.dispatchEvent(event);
}

// Check for service worker updates manually
export async function checkForUpdates() {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  } catch (error) {
    console.error('CoCoスモ: Failed to check for updates:', error);
    return false;
  }
}

// Get the current service worker status
export async function getStatus() {
  if (!isServiceWorkerSupported()) {
    return { supported: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      return { supported: true, registered: false };
    }

    return {
      supported: true,
      registered: true,
      active: !!registration.active,
      waiting: !!registration.waiting,
      installing: !!registration.installing,
      scope: registration.scope
    };
  } catch (error) {
    return { supported: true, error: error.message };
  }
}

export default {
  isServiceWorkerSupported,
  registerServiceWorker,
  unregisterServiceWorker,
  skipWaiting,
  cacheUrls,
  checkForUpdates,
  getStatus
};
