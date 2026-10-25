/* GitHub Pages service worker. Network-first for app code to avoid stale releases. */
const CACHE='astraforge-ghpages-v7-browser-simulator';
const SHELL=['./','./index.html','./app.js','./catalog.js','./astraforge_web.py','./webviz.js','./examples/scene.py','./examples/flight.py','./examples/ui.py','./examples/database.py','./examples/site.html','./examples/python_site.py','./worker.js','./style.css','./manifest.webmanifest','./icons/logo.svg','./icons/icon-192.png','./icons/icon-512.png','./wheels/astra_simulator_client-1.3.0-py3-none-any.whl','./astra-bridge/engine-manifest.json','./astra-bridge/browser_client_bridge.py','./examples/astra_browser_demo.py'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return; // never cache cross-origin APIs/AI/CDN in this app SW
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const result=await fetch(event.request);
   if(result.ok)await cache.put(event.request,result.clone());
   return result;
  }catch(err){const cached=await cache.match(event.request);if(cached)return cached;throw err;}
 })());
});
