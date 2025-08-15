const CACHE_NAME = 'drivego-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/static/images/logo-192.png'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('DriveGo SW: Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('DriveGo SW: Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('DriveGo SW: Activation');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('DriveGo SW: Suppression ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retourne la ressource depuis le cache si elle existe
        if (response) {
          return response;
        }
        
        // Sinon, récupère la ressource depuis le réseau
        return fetch(event.request)
          .then(response => {
            // Vérification de la validité de la réponse
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone la réponse car elle ne peut être consommée qu'une seule fois
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // En cas d'erreur réseau, retourne une page de fallback si disponible
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Gestion des notifications push (optionnel)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/static/images/logo perce-neige.PNG',
      badge: '/static/images/logo perce-neige.PNG',
      vibrate: [200, 100, 200],
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});