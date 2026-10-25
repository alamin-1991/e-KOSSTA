const CACHE = 'ekossta-report-participant-choice-20261025';
const SHELL = [
  './', './index.html', './styles.css', './material-ui.css',
  './ekossta-ui-refresh.css', './ekossta-terminal-ui.css',
  './app.js', './manifest.webmanifest', './icon-192.svg', './icon-512.svg',
  './assets/dashboard-pixel-art.webp'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleusercontent.com')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (!response || !response.ok) return response;
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
});
