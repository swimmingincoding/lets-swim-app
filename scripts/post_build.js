import fs from 'fs';
import path from 'path';

const distDir = 'dist';
const assetsDir = path.join(distDir, 'assets');

const assetFiles = [];
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  for (const f of files) {
    if (f.endsWith('.js') || f.endsWith('.css')) {
      assetFiles.push(`./assets/${f}`);
      assetFiles.push(`/assets/${f}`);
    }
  }
}

console.log(`Found built assets: ${JSON.stringify(assetFiles)}`);

const versionTimestamp = Math.floor(Date.now() / 1000);
const assetJson = JSON.stringify(assetFiles);

const swTemplate = `// Lets Swim World Masters - PWA Offline Service Worker (iOS Safari & Chrome Optimized)
const CACHE_NAME = 'letsswim-v__VERSION__';

const PRECACHE_ASSETS = [
  '/',
  './',
  '/index.html',
  './index.html',
  '/manifest.json',
  './manifest.json',
  '/icon-192.png',
  './icon-192.png',
  '/icon-512.png',
  './icon-512.png',
  '/logo.png',
  './logo.png',
  '/apple-touch-icon.png',
  './apple-touch-icon.png',
  '/data/masters_data.json',
  './data/masters_data.json'
];

const BUILT_ASSETS = __BUILT_ASSETS__;

const ALL_ASSETS = [...PRECACHE_ASSETS, ...BUILT_ASSETS];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching all essential assets for offline');
      return Promise.allSettled(
        ALL_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW Precache Error]', url, err))
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Clearing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1. Navigation requests (Page reload / navigation when offline in Safari)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/index.html')
          .then((res) => res || caches.match('./index.html'))
          .then((res) => res || caches.match('/'))
          .then((res) => res || caches.match('./'));
      })
    );
    return;
  }

  // 2. Official Dataset: Network-First to guarantee newest official timeline, cache fallback offline
  if (req.url.includes('/data/masters_data.json')) {
    event.respondWith(
      fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match('/data/masters_data.json')
          .then((res) => res || caches.match('./data/masters_data.json'));
      })
    );
    return;
  }

  // 3. Cache-First with Stale-While-Revalidate for static assets
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const resClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, resClone);
        });
        return networkResponse;
      }).catch(() => {
        const url = new URL(req.url);
        return caches.match(url.pathname);
      });
    })
  );
});
`;

const finalSw = swTemplate.replace('__VERSION__', String(versionTimestamp)).replace('__BUILT_ASSETS__', assetJson);

// Write to both public/sw.js and dist/sw.js
if (fs.existsSync('public')) {
  fs.writeFileSync('public/sw.js', finalSw, 'utf-8');
}
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'sw.js'), finalSw, 'utf-8');
}

console.log('Successfully injected built asset hashes into sw.js!');
