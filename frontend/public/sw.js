/**
 * SLM Service Worker
 *
 * Strategy:
 *   - App Shell (HTML/JS/CSS/fonts/icons): Cache-First → app loads instantly offline
 *   - API calls (/api/*):                  Network-First → always try live data,
 *                                           falls back to a JSON offline error
 *   - Everything else:                     Network with cache fallback
 */

const CACHE_NAME = 'slm-v1';
const OFFLINE_API_RESPONSE = JSON.stringify({
  error: 'OFFLINE',
  detail: 'You are offline. Please reconnect to translate text.'
});

// Assets to pre-cache on install (app shell)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Install: pre-cache the app shell ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Take control immediately without waiting for old SW to expire
  self.skipWaiting();
});

// ── Activate: purge old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  // Take control of all existing clients immediately
  self.clients.claim();
});

// ── Fetch: routing logic ─────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // API calls → Network-First, offline JSON fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() =>
          new Response(OFFLINE_API_RESPONSE, {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          })
        )
    );
    return;
  }

  // App Shell (navigation + static assets) → Cache-First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Cache successful GET responses for static assets
        if (request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Navigation fallback: serve index.html so the SPA still loads
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
