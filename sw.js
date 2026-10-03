/* Gen Diary — офлайн-кэш. Сначала отдаём из кэша, в фоне обновляем. */
const CACHE = 'gendiary-v2';
const ASSETS = [
  './',
  'index.html',
  'app.css',
  'app.js',
  'logo.js',
  'fonts.css',
  'manifest.webmanifest',
  'preact-htm.js',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'favicon-32.png',
  'favicon-64.png',
  'montserrat-cyrillic-700-normal.woff2',
  'montserrat-latin-700-normal.woff2',
  'montserrat-cyrillic-800-italic.woff2',
  'montserrat-latin-800-italic.woff2',
  'onest-cyrillic-400-normal.woff2',
  'onest-latin-400-normal.woff2',
  'onest-cyrillic-500-normal.woff2',
  'onest-latin-500-normal.woff2',
  'onest-cyrillic-600-normal.woff2',
  'onest-latin-600-normal.woff2'
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
