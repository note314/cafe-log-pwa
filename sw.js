// Service Worker temporarily disabled for debugging
const CACHE_NAME = 'cafe-log-dupfix-' + Date.now();
const urlsToCache = [
  // Caching disabled
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/themes.css',
  './css/components.css',
  './css/mobile.css',
  './css/badges.css',
  './css/debug.css',
  './js/app.js',
  './js/utils/storage.js',
  './js/utils/progress.js',
  './js/utils/qr.js',
  './js/utils/touch.js',
  './js/utils/performance.js',
  './js/utils/scraper.js',
  './js/utils/store-data-generator.js',
  './js/debug-menu.js',
  './js/components/header.js',
  './js/components/navigation.js',
  './js/components/map.js',
  './js/pages/top.js',
  './js/pages/stores.js',
  './js/pages/achievements.js',
  './images/logo.svg',
  './data/store_list.json',
  './icons/icon-192x192.svg',
  './icons/icon-512x512.svg'
];

// Install Event - DISABLED for debugging
self.addEventListener('install', event => {
  console.log('Service Worker install - caching disabled');
  self.skipWaiting(); // 新しいService Workerを即座に有効化
});

// Activate Event - 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // 新しいService Workerでページを制御
});

// Fetch Event - ネットワーク要求の処理
self.addEventListener('fetch', event => {
  event.respondWith(
    // store_list.json は常に最新版を取得
    event.request.url.includes('store_list.json') ?
      fetch(event.request).then(response => {
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      }).catch(() => {
        // オフライン時のみキャッシュから取得
        return caches.match(event.request);
      }) :
      
    // その他のリソースの通常処理
    caches.match(event.request)
      .then(response => {
        // キャッシュが見つかった場合、それを返す
        if (response) {
          return response;
        }

        // Google Maps APIは常にネットワークから取得
        if (event.request.url.includes('maps.googleapis.com') || 
            event.request.url.includes('maps.gstatic.com')) {
          return fetch(event.request);
        }

        // その他のリソースはネットワークから取得し、キャッシュに保存
        return fetch(event.request).then(response => {
          // 有効なレスポンスのみキャッシュ
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      }).catch(() => {
        // オフライン時のフォールバック
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// Background Sync (将来的な機能拡張用)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // 将来的にデータ同期機能を実装する場合
  console.log('Background sync performed');
}

// Push通知 (将来的な機能拡張用)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Cafe★Logに新しい更新があります',
    icon: './icons/icon-192x192.png',
    badge: './icons/badge-72x72.png'
  };

  event.waitUntil(
    self.registration.showNotification('Cafe★Log', options)
  );
});