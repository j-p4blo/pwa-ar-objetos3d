const CACHE_NAME = 'atlas3d-v2';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];
const ICON_ASSETS = [
  '/iconos/icon-192.png',
  '/iconos/icon-512.png',
  '/iconos/icon-512-maskable.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(CORE_ASSETS);
      for (const url of ICON_ASSETS) {
        const respuesta = await fetch(url);
        await cache.put(url, respuesta);
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(nombres =>
      Promise.all(
        nombres.filter(nombre => nombre !== CACHE_NAME).map(nombre => caches.delete(nombre))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(
      encontrado => encontrado || fetch(event.request)
    )
  );
});