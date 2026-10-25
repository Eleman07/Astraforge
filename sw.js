const CACHE = "astraforge-ghpages-v3";
const SHELL = ["./", "./index.html", "./app.js", "./worker.js", "./style.css", "./manifest.webmanifest", "./icons/logo.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./wheels/astra_simulator_client-1.3.0-py3-none-any.whl"];
self.addEventListener("install", event => {event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting();});
self.addEventListener("activate", event => {event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch", event => {const url=new URL(event.request.url);if(event.request.method!=="GET")return;
 if(url.origin===self.location.origin){event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){let copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;})));return;}
 // Pyodide CDN files can be cached after their first successful download; offline support is best-effort.
 if(url.hostname==="cdn.jsdelivr.net" && url.pathname.startsWith("/pyodide/v314.0.7/")){
   event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok||response.type==="opaque"){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;})));}
});
