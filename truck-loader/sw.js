'use strict';
const PREFIX = 'vankov-truck-loader-';
const CACHE = PREFIX + 'v1';
const ROOT = self.registration.scope;
const FILES = ['index.html','pack.js','weight.js','stack.js','manual.js','editor.js','free-space.js','free-space-check.js','free-space-ui.js','pallet-basis.js','app.js','pwa.js','ntz-background.jpg','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
const ALLOWED = new Set(FILES.map(file => new URL(file, ROOT).href));
self.addEventListener('install', event => {
  // An update activates only after all windows using the previous version close.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(FILES.map(file => new Request(new URL(file, ROOT), {cache:'reload'})));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== new URL(ROOT).origin || !url.href.startsWith(ROOT)) return;
  const isHome = request.mode === 'navigate' && (url.pathname === new URL(ROOT).pathname || url.pathname === new URL('index.html',ROOT).pathname);
  if (!isHome && !ALLOWED.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = isHome ? new URL('index.html',ROOT).href : url.href;
    // Online releases win; only public app assets are stored. Form/API calls are excluded.
    try {
      const response = await fetch(request);
      if (response.ok) { await cache.put(key,response.clone()); return response; }
      if (response.status < 500) return response;
      return (await cache.match(key)) || response;
    } catch {return (await cache.match(key)) || new Response('Няма интернет. Отвори приложението веднъж онлайн.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  })());
});
