const VERSION = 'skin-studio-v1';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable.png'];
const CDN = [
  'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);
    await Promise.all(CDN.map(u => fetch(u, {mode: 'no-cors'}).then(r => cache.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isCDN = url.hostname === 'cdn.jsdelivr.net';
  const sameOrigin = url.origin === location.origin;
  if (!sameOrigin && !isFont && !isCDN) return;

  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req);
    if (isCDN || isFont) {
      if (cached) return cached;
      try { const r = await fetch(req); cache.put(req, r.clone()); return r; } catch (err) { return cached || Response.error(); }
    }
    try {
      const r = await fetch(req);
      if (r.ok) cache.put(req, r.clone());
      return r;
    } catch (err) {
      return cached || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
    }
  })());
});