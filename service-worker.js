/* DNCH Mobile v0.1 — limited, public app-shell offline cache.
   Never intercept Supabase, YouTube, auth redirects, forum/admin pages, or API calls.
   Never store sensitive/session pages. Online content always wins. */
'use strict';
const VERSION='dnch-mobile-public-v1';
const PREFIX='dnch-mobile-public-';
const SCOPE=new URL(self.registration.scope);
const PUBLIC_FILES=[
 './','./index.html','./bg/','./bg/index.html',
 './my-dnch.html','./bg/my-dnch.html',
 './today.html','./bg/today.html',
 './radio.html','./bg/radio.html',
 './assets/site.css','./assets/my-dnch.css',
 './assets/my-dnch.js','./assets/my-dnch-backup.js',
 './assets/today.js','./assets/radio.css','./assets/radio.js',
 './assets/forum-config.js','./assets/dnch-ai-config.js','./assets/dnch-ai.js',
 './manifest.webmanifest','./manifest-bg.webmanifest',
 './assets/icons/dnch-192.png','./assets/icons/dnch-512.png',
 './offline.html'
];
const allowed=new Set(PUBLIC_FILES.map(p=>new URL(p,SCOPE).pathname));
const OFFLINE=new URL('./offline.html',SCOPE).href;
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(VERSION);
  // An optional asset failing must not prevent PWA install/update.
  await Promise.allSettled(PUBLIC_FILES.map(async file=>{
   const url=new URL(file,SCOPE);
   const response=await fetch(new Request(url.href,{cache:'reload',credentials:'same-origin'}));
   if(response.ok&&response.type==='basic')await cache.put(url.href,response);
  }));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==VERSION).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname)||!allowed.has(url.pathname))return;
 // Do not cache auth tokens, magic-link callbacks, pilot flags or other query data.
 if(url.search)return;
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION);
  try{
   const network=await fetch(request);
   if(network.ok&&network.type==='basic'){
    try{await cache.put(url.href,network.clone())}catch(err){console.warn('DNCH cache storage unavailable',err)}
   }
   return network;
  }catch(error){
   const cached=await cache.match(url.href);
   if(cached)return cached;
   if(request.mode==='navigate'){
    const fallback=await cache.match(OFFLINE);
    if(fallback)return fallback;
   }
   return new Response('DNCH: offline',{status:503,statusText:'Offline',headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }
 })());
});
