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


function cacheFirst(peticion) {
  return caches.match(peticion).then(enCache => {
    if (enCache) return enCache;
    return fetch(peticion).then(respuesta => {
      const clon = respuesta.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(peticion, clon));
      return respuesta;
    });
  });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/iconos/')) {
    // Íconos y, más adelante, modelos .glb: inmutables → Cache First
    event.respondWith(cacheFirst(event.request));
  } else if (url.pathname.startsWith('/api/')) {
    // Futuro catálogo de modelos: debe verse al día → Network First
    event.respondWith(networkFirst(event.request));
  } else {
    // Shell (HTML, manifest): rápido, y se actualiza solo → Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(event.request));
  }
});