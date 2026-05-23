const CACHE_NAME = 'miiam-v2';
const STATIC_CACHE = 'miiam-static-v2';
const DYNAMIC_CACHE = 'miiam-dynamic-v2';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

const API_CACHE_DURATION = 5 * 60 * 1000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
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

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE, '/offline.html'));
    return;
  }
  
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.method === 'GET') {
    if (request.destination === 'image') {
      event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
      return;
    }

    if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      return;
    }

    if (url.origin === location.origin) {
      event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
      return;
    }
  }

  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName, fallbackUrl) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      const cache = caches.open(cacheName);
      cache.then((c) => c.put(request, response.clone()));
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
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

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
