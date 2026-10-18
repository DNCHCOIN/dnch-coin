/* DNCH Mobile v0.1 — limited, public app-shell offline cache.
   Never intercept Supabase, YouTube, auth redirects, forum/admin pages, or API calls.
   Never store sensitive/session pages. Online content always wins. */
'use strict';
const VERSION='dnch-mobile-public-v2';
const PREFIX='dnch-mobile-public-';
const SCOPE=new URL(self.registration.scope);
const PUBLIC_FILES=[
 './','./index.html','./bg/','./bg/index.html',
 './my-dnch.html','./bg/my-dnch.html',
 './today.html','./bg/today.html',
 './radio.html','./bg/radio.html',
 './assets/site.css','./assets/my-dnch.css','./assets/pwa.js',
 './assets/my-dnch.js','./assets/my-dnch-backup.js',
 './assets/today.js','./assets/radio.css','./assets/radio.js',
 './assets/forum-config.js','./assets/dnch-ai-config.js','./assets/dnch-ai.js',
 './manifest.webmanifest','./manifest-bg.webmanifest',
 './assets/icons/dnch-192.png','./assets/icons/dnch-512.png',
 './offline.html'
];
// These files must all be downloaded before an update replaces a working offline shell.
const CRITICAL_FILES=[
 './index.html','./bg/index.html',
 './my-dnch.html','./bg/my-dnch.html',
 './offline.html','./assets/site.css','./assets/my-dnch.css',
 './assets/my-dnch.js','./assets/my-dnch-backup.js','./assets/pwa.js'
];
const allowed=new Set(PUBLIC_FILES.map(p=>new URL(p,SCOPE).pathname));
const OFFLINE=new URL('./offline.html',SCOPE).href;
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(VERSION);
  const addFile=async file=>{
   const url=new URL(file,SCOPE);
   const response=await fetch(new Request(url.href,{cache:'reload',credentials:'same-origin'}));
   if(!response.ok||response.type!=='basic')throw new Error('Unable to precache '+file);
   await cache.put(url.href,response);
  };
  try{
   // Reject a broken/offline update. The currently active worker and its old cache
   // continue serving users; only a fully cached shell is allowed to activate.
   await Promise.all(CRITICAL_FILES.map(addFile));
   // Secondary public assets are best-effort, since cached pages are network-first.
   await Promise.allSettled(PUBLIC_FILES.filter(file=>!CRITICAL_FILES.includes(file)).map(addFile));
   await self.skipWaiting();
  }catch(error){
   await caches.delete(VERSION);
   throw error;
  }
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
  const offlineCopy=async()=>{
   const cached=await cache.match(url.href);
   if(cached)return cached;
   if(request.mode==='navigate')return (await cache.match(OFFLINE))||null;
   return null;
  };
  try{
   const network=await fetch(request);
   if(network.ok&&network.type==='basic'){
    try{await cache.put(url.href,network.clone())}catch(err){console.warn('DNCH cache storage unavailable',err)}
   }
   // Keep serving already saved public pages through temporary server outages,
   // but do NOT disguise a real 404/403 or cache errors as successful pages.
   if(network.status>=500)return (await offlineCopy())||network;
   return network;
  }catch(error){
   return (await offlineCopy())||new Response('DNCH: offline',{
    status:503,statusText:'Offline',headers:{'Content-Type':'text/plain; charset=utf-8'}
   });
  }
 })());
});
