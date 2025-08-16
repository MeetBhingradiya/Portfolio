// Timetable Service Worker for offline functionality

const CACHE_NAME = 'timetable-cache-v1';
const API_CACHE_NAME = 'timetable-api-cache-v1';

// URLs to cache for offline use
const urlsToCache = [
    '/timetable',
    '/api/timetable',
    // Add other static assets if needed
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname.startsWith('/api/timetable')) {
        event.respondWith(
            handleApiRequest(request)
        );
        return;
    }

    // Handle page requests
    if (url.pathname === '/timetable' || url.pathname.startsWith('/timetable/')) {
        event.respondWith(
            handlePageRequest(request)
        );
        return;
    }

    // Default fetch behavior for other requests
    event.respondWith(
        fetch(request).catch(() => {
            return caches.match(request);
        })
    );
});

async function handleApiRequest(request) {
    const url = new URL(request.url);
    const cacheKey = url.pathname + url.search;

    try {
        // Try to fetch from network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok && request.method === 'GET') {
            // Cache successful GET responses
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(cacheKey, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed, try to serve from cache
        const cache = await caches.open(API_CACHE_NAME);
        const cachedResponse = await cache.match(cacheKey);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If no cache available, return a basic error response
        return new Response(
            JSON.stringify({ 
                error: 'Offline - data not available in cache',
                offline: true 
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

async function handlePageRequest(request) {
    try {
        // Try network first
        return await fetch(request);
    } catch (error) {
        // Serve cached page if network fails
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('/timetable');
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to a basic offline page
        return new Response(
            `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Offline - Timetable</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 50px;
                        background-color: #f5f5f5;
                    }
                    .offline-container {
                        max-width: 400px;
                        margin: 0 auto;
                        background: white;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .offline-icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <div class="offline-icon">📴</div>
                    <h1>You're Offline</h1>
                    <p>Please check your internet connection and try again.</p>
                    <button onclick="window.location.reload()">Retry</button>
                </div>
            </body>
            </html>
            `,
            {
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-timetables') {
        event.waitUntil(syncTimetables());
    }
});

async function syncTimetables() {
    try {
        // Sync any pending timetable data when back online
        const cache = await caches.open(API_CACHE_NAME);
        const keys = await cache.keys();
        
        // Re-fetch all cached API endpoints to ensure fresh data
        for (const request of keys) {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    await cache.put(request, response);
                }
            } catch (error) {
                console.log('Failed to sync:', request.url);
            }
        }
    } catch (error) {
        console.log('Background sync failed:', error);
    }
}
