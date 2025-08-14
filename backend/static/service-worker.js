const CACHE_NAME = 'drivego-v2'; // ⚠️ Changez la version !

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('DriveGo PWA installée avec nouveau logo');
  self.skipWaiting();
});

// Activation - nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  console.log('DriveGo PWA activée');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Le reste de votre code reste identique...