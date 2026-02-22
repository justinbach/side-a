// Side A service worker
// Handles PWA update lifecycle - no custom caching (Next.js handles that)

self.addEventListener('install', () => {
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Take control of all open clients immediately
  event.waitUntil(clients.claim())
})
