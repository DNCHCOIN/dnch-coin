const CACHE='vacha-static-v19';const ASSETS=['./','./index.html','./hydro-widget.css','./hydro-widget.js','./temperature.js','./gallery.js','./app.js','./community.html','./community.js','./telegram-review.js','./vacha-assistant.js','./icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
if(u.pathname.endsWith('/data/hydro.json')||u.pathname.endsWith('/data/water-calibration.json'))return; // never pretend measurements current from an offline cache
if(e.request.mode==='navigate'||u.pathname.endsWith('/index.html')){e.respondWith(fetch(e.request,{cache:'no-store'}).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(x=>x.put(e.request,copy))}return res}).catch(async()=>await caches.match(e.request)||await caches.match('./index.html')));return}
e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(x=>x.put(e.request,copy))}return res})))
});
