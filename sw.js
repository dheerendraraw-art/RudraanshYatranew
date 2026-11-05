// Rudraansh Yatra Staff & Admin Portal - Service Worker (Phase 7)
const CACHE_NAME = 'ry-admin-cache-v2';

const STATIC_SHELL_ASSETS = [
    '/',
    '/admin.html',
    '/style.css?v=8.7',
    '/style.css',
    '/manifest.json',
    '/assets/images/logo.png'
];

// 1. Install event: Pre-cache app shell assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_SHELL_ASSETS).catch((err) => {
                console.warn('RY SW: Pre-cache non-fatal warning:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// 2. Activate event: Clean up previous cache versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch event: Network-first for dynamic navigation, Stale-While-Revalidate for static assets
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Non-GET requests (POST, PATCH, DELETE) bypass service worker cache
    if (req.method !== 'GET') return;

    // Supabase API requests: Try network; if offline, return structured offline response
    if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(req).catch(() => {
                return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // HTML / Page Navigation requests: Network-first, fallback to cached admin.html
    if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(req)
                .then((networkResp) => {
                    if (networkResp && networkResp.status === 200) {
                        const copy = networkResp.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                    }
                    return networkResp;
                })
                .catch(() => {
                    return caches.match(req).then((cached) => cached || caches.match('/admin.html'));
                })
        );
        return;
    }

    // Static Assets (CSS, JS, Fonts, Images): Cache-first with background network revalidation
    event.respondWith(
        caches.match(req).then((cached) => {
            const networkFetch = fetch(req).then((networkResp) => {
                if (networkResp && networkResp.status === 200) {
                    const copy = networkResp.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                }
                return networkResp;
            }).catch(() => null);

            return cached || networkFetch;
        })
    );
});

