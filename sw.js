/* Gen Diary — офлайн-кэш. Сначала отдаём из кэша, в фоне обновляем. */
const CACHE = 'gendiary-v1';
const ASSETS = [
  './',
  'index.html',
  'app.css',
  'app.js',
  'logo.js',
  'fonts.css',
  'manifest.webmanifest',
  'vendor/preact-htm.js',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/favicon-32.png',
  'icons/favicon-64.png',
  'fonts/montserrat-cyrillic-700-normal.woff2',
  'fonts/montserrat-latin-700-normal.woff2',
  'fonts/montserrat-cyrillic-800-italic.woff2',
  'fonts/montserrat-latin-800-italic.woff2',
  'fonts/onest-cyrillic-400-normal.woff2',
  'fonts/onest-latin-400-normal.woff2',
  'fonts/onest-cyrillic-500-normal.woff2',
  'fonts/onest-latin-500-normal.woff2',
  'fonts/onest-cyrillic-600-normal.woff2',
  'fonts/onest-latin-600-normal.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((hit) => {
        const net = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit || (req.mode === 'navigate' ? cache.match('index.html') : undefined));
        return hit || net;
      })
    )
  );
});
