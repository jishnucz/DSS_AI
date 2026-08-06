/**
 * 🌾 AgriDSS Service Worker
 * Enables offline access for farmers in remote areas
 */

const CACHE_NAME = 'agridss-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Crop data to cache locally
const CROP_DATA = {
  rice: {
    stages: ['Nursery', 'Transplanting', 'Tillering', 'Flowering', 'Grain Filling', 'Harvest'],
    duration: [20, 15, 30, 20, 25, 10],
    water_needs: ['High', 'Very High', 'High', 'Medium', 'Low', 'None'],
    fertilizer: {
      basal: 'Apply 50kg/ha NPK before transplanting',
      tillering: 'Apply 30kg/ha Urea at 3 weeks',
      panicle: 'Apply 20kg/ha Potash at flowering'
    }
  },
  coconut: {
    maintenance: 'Apply 500g NPK per palm annually',
    irrigation: '40-50 liters per palm every 4 days in summer',
    pest_watch: ['Rhinoceros beetle', 'Red palm weevil', 'Leaf rot']
  },
  banana: {
    duration: '12-14 months to harvest',
    spacing: '2m x 2m for Nendran variety',
    irrigation: 'Weekly irrigation, avoid waterlogging'
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API calls - let them go to network
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return cached crop data for offline API calls
          return new Response(JSON.stringify({
            offline: true,
            message: 'You are offline. Showing cached data.',
            crop_data: CROP_DATA
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-success responses
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Clone and cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync for when connection returns
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Sync any offline data when connection returns
  console.log('[SW] Syncing offline data...');
}

// Push notifications for alerts
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || '🌾 AgriDSS Alert';
  const options = {
    body: data.body || 'New farming advisory available',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

console.log('[SW] Service Worker loaded');
