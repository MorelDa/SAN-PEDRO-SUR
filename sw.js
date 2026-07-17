const CACHE_NAME = 'san-pedro-sur-v1';
const ASSETS = [
  './',
  './index.html',
  './datos.json'
];

// Instalar el Service Worker y almacenar recursos estáticos
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activar el Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de Red Primero (Network First) con caída a Caché para streaming y JSON de datos dinámicos
self.addEventListener('fetch', (e) => {
  // Ignorar peticiones de streaming de audio o TV para evitar corromper la caché
  if (e.request.url.includes('miestacion.turadioonline.com.ar') || e.request.url.includes('.mp4') || e.request.url.includes('.m3u8')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Si la respuesta es válida, clonarla en la caché
        if (response && response.status === 200) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseCopy);
          });
        }
        return response;
      })
      .catch(() => {
        // Si no hay internet, buscar en la caché
        return caches.match(e.request);
      })
  );
});
