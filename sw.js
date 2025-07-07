const CACHE_NAME = 'tahadi-alsuwar-offline-v2';
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
    '/assets/icon-192.png',
    '/assets/icon-512.png',
    '/assets/metadata.json',
    '/assets/solutions.json',
    '/assets/answers.pdf',
    '/assets/image1.webp',
    '/assets/image2.webp',
    '/assets/image3.webp',
    '/assets/image4.webp',
    '/assets/image5.webp',
    '/assets/image6.webp',
    '/assets/image7.webp',
    '/assets/image8.webp',
    '/assets/image9.webp',
    '/assets/image10.webp',
    '/assets/image11.webp',
    '/assets/image12.webp',
    '/assets/image13.webp',
    '/assets/image14.webp',
    '/assets/image15.webp',
    '/assets/image16.webp',
    '/assets/image17.webp',
    '/assets/image18.webp',
    '/assets/image19.webp',
    '/assets/image20.webp',
    '/assets/image21.webp',
    '/assets/image22.webp',
    '/assets/image23.webp',
    '/assets/image24.webp',
    '/assets/image25.webp',
    '/assets/image26.webp',
    '/assets/image27.webp',
    '/assets/image28.webp',
    '/assets/image29.webp',
    '/assets/image30.webp',
    '/assets/image31.webp',
    '/assets/image32.webp',
    '/assets/image33.webp',
    '/assets/image34.webp',
    '/assets/image35.webp',
    '/assets/image36.webp',
    '/assets/image37.webp',
    '/assets/image38.webp',
    '/assets/image39.webp',
    '/assets/image40.webp',
    '/assets/image41.webp',
    '/assets/image42.webp',
    '/assets/image43.webp',
    '/assets/image44.webp',
    '/assets/image45.webp',
    '/assets/image46.webp',
    '/assets/image47.webp',
    '/assets/image48.webp',
    '/assets/image49.webp',
    '/assets/image50.webp',
    '/assets/image51.webp',
    '/assets/image52.webp',
    '/assets/image53.webp',
    '/assets/image54.webp',
    '/assets/image55.webp',
    '/assets/image56.webp',
    '/assets/image57.webp',
    '/assets/image58.webp',
    '/assets/image59.webp',
    '/assets/image60.webp',
    '/assets/image61.webp',
    '/assets/image62.webp',
    '/assets/image63.webp',
    '/assets/image64.webp',
    '/assets/image65.webp',
    '/assets/image66.webp',
    '/assets/image67.webp',
    '/assets/image68.webp',
    '/assets/image69.webp',
    '/assets/image70.webp'
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

                    if (event.request.url.endsWith('.pdf')) {
                        return caches.match('/assets/answers.pdf') || new Response('الملف غير متاح في وضع الأوفلاين', { status: 404 });
                    }

                    return new Response('', { status: 200, statusText: 'OK' });
                });
            })
    );
});