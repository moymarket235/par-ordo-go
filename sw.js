const CACHE='po-go-v17';
const SHELL=['./','./index.html','./manifest.webmanifest','./assets/par-ordo-logo.png','./assets/par-ordo-logo.webp','./assets/bg-banya.jpg','./assets/ornament-corner.svg','./assets/ribbons.svg','./par-ordo-go-cinema-v1.css','./par-ordo-go-cinema-v1.js'];
async function cacheOk(cache,request,response){
  if(response && response.ok && response.type!=='opaque'){
    try{await cache.put(request,response.clone())}catch(_){ }
  }
  return response;
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(SHELL.map(async path=>{
      try{const response=await fetch(path,{cache:'reload'});if(response.ok)await cache.put(path,response)}catch(_){ }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const isPage=request.mode==='navigate'||url.pathname.endsWith('.html')||url.pathname.endsWith('/');
  const isImage=/\.(png|jpg|jpeg|webp|svg)$/i.test(url.pathname);
  if(isPage||isImage){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=await fetch(request);
        if(response.ok)await cacheOk(cache,request,response);
        return response;
      }catch(_){
        const cached=await cache.match(request)||await cache.match('./index.html');
        return cached||new Response('Offline',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok){const cache=await caches.open(CACHE);await cacheOk(cache,request,response)}
      return response;
    }catch(_){return new Response('',{status:504})}
  })());
});
