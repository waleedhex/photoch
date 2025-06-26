const CACHE_NAME = 'tahadi-alsuwar-offline-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/admin.html',
    '/script.js',
    '/styles.css',
    '/codes.json',
    '/announcements.json',
    '/manifest.json',
    '/assets/default_category.webp',
    '/assets/stickers/sticker1.png',
    '/assets/stickers/sticker2.png',
    '/assets/icon.png',
    '/assets/icon-512.png',
    '/assets/metadata.json',
    '/assets/solutions.json',
    '/assets/1.webp',
    '/assets/2.webp',
    '/assets/3.webp',
    '/assets/4.webp',
    '/assets/5.webp',
    '/assets/6.webp',
    '/assets/7.webp',
    '/assets/8.webp',
    '/assets/9.webp',
    '/assets/10.webp',
    '/assets/11.webp',
    '/assets/12.webp',
    '/assets/13.webp',
    '/assets/14.webp',
    '/assets/15.webp',
    '/assets/16.webp',
    '/assets/17.webp',
    '/assets/18.webp',
    '/assets/19.webp',
    '/assets/20.webp',
    '/assets/21.webp',
    '/assets/22.webp',
    '/assets/23.webp',
    '/assets/24.webp',
    '/assets/25.webp',
    '/assets/26.webp',
    '/assets/27.webp',
    '/assets/28.webp',
    '/assets/29.webp',
    '/assets/30.webp',
    '/assets/31.webp',
    '/assets/32.webp',
    '/assets/33.webp',
    '/assets/34.webp',
    '/assets/35.webp',
    '/assets/36.webp',
    '/assets/37.webp',
    '/assets/38.webp',
    '/assets/39.webp',
    '/assets/40.webp',
    '/assets/41.webp',
    '/assets/42.webp',
    '/assets/43.webp',
    '/assets/44.webp',
    '/assets/45.webp',
    '/assets/46.webp',
    '/assets/47.webp',
    '/assets/48.webp',
    '/assets/49.webp',
    '/assets/50.webp'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching files...');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Caching failed:', error);
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('Serving from cache:', event.request.url);
                    return response;
                }

                console.log('Fetching from network:', event.request.url);
                return fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    console.warn('Network fetch failed, serving fallback for:', event.request.url);

                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }

                    if (event.request.destination === 'image') {
                        return caches.match('/assets/default_category.webp');
                    }

                    if (event.request.url.includes('.json')) {
                        return new Response('{}', { status: 200, statusText: 'OK' });
                    }

                    return new Response('', { status: 200, statusText: 'OK' });
                });
            })
    );
});