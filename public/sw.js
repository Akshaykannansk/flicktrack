// This is a basic service worker for PWA functionality.
// It enables the app to be installed.

self.addEventListener('fetch', (event) => {
  // For now, we're just passing through fetch events.
  // This can be expanded to include caching strategies.
  event.respondWith(fetch(event.request));
});
