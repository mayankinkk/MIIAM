const CACHE_NAME = 'miiam-v4';
const STATIC_CACHE = 'miiam-static-v4';
const DYNAMIC_CACHE = 'miiam-dynamic-v4';

// Only evergreen, build-independent files are pre-cached.
// HTML and RSC payloads are NEVER cached: they reference content-hashed
// /_next/static chunks that vanish on every deploy (stale copies cause 404s).
const STATIC_ASSETS = [
  '/manifest.json',
  '/partner-manifest.json',
  '/offline.html',
  '/partner-offline.html',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(STATIC_ASSETS.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Navigations: always network, offline falls back to the static offline page.
  if (request.mode === 'navigate') {
    event.respondWith(navigationWithOfflineFallback(request));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Same-origin (RSC payloads, etc.) and third-party: network only, never cache —
  // cached RSC payloads reference deleted chunks after a deploy.
  event.respondWith(networkOnly(request));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  let response;
  try {
    response = await fetch(request);
  } catch (fetchErr) {
    console.error('Fetch failed in cacheFirst:', fetchErr);
    return new Response('Offline', { status: 503 });
  }

  if (response && response.ok) {
    try {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    } catch (cacheErr) {
      console.warn('Failed to cache response in cacheFirst:', cacheErr);
    }
  }

  return response;
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function navigationWithOfflineFallback(request) {
  try {
    return await fetch(request);
  } catch {
    const offline = await caches.match('/offline.html');
    if (offline) return offline;
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  let response;
  try {
    response = await fetch(request);
  } catch (fetchErr) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }

  if (response && response.ok) {
    try {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    } catch (cacheErr) {
      console.warn('Failed to cache response in networkFirst:', cacheErr);
    }
  }

  return response;
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'MIIAM';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    data: data.url || '/',
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders' || event.tag === 'sync-reviews') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  try {
    const cache = await caches.open('miiam-pending-v4');
    const requests = await cache.keys();
    for (const request of requests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
        }
      } catch {
        // Will retry on next sync
      }
    }
  } catch {
    // Queue not available
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
