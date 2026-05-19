// Service Worker สำหรับจัดการ Cache
const CACHE_NAME = 'fire-extinguisher-v2-' + Date.now();
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Install event - ลบ cache เก่าทั้งหมด
self.addEventListener('install', (event) => {
  console.log('SW: Installing new version');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('SW: Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('SW: All old caches deleted');
      return self.skipWaiting();
    })
  );
});

// Activate event - ทำความสะอาด cache เก่า
self.addEventListener('activate', (event) => {
  console.log('SW: Activating new version');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          console.log('SW: Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('SW: Taking control of all clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - ไม่ใช้ cache เลย ดึงจาก network เสมอ
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request.clone()).then((response) => {
      // ส่งคืน response ใหม่เสมอ ไม่เก็บ cache
      return response;
    }).catch(() => {
      // หาก network ล้มเหลว ให้ลองดูใน cache
      return caches.match(event.request);
    })
  );
});

// Message event - รับคำสั่งจาก client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('SW: Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('SW: Received CLEAR_CACHE message');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('SW: Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('SW: All caches cleared');
        // Reload all clients
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        });
      })
    );
  }
});