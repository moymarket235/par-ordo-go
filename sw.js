const V='po-go-v8',QR='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
const FILES=['./','index.html','manifest.webmanifest','assets/par-ordo-logo.png','assets/bg-banya.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(async c=>{
  await Promise.all(FILES.map(f=>c.add(f).catch(()=>{})));
  try{await c.add(new Request(QR,{mode:'no-cors'}))}catch(_){}
}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const put=(r,x)=>{const c=x.clone();caches.open(V).then(k=>k.put(r,c));return x};
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.href===QR){e.respondWith(caches.match(r).then(m=>m||fetch(r)));return}
  if(u.origin!==location.origin)return;
  if(/\.(jpg|jpeg|png|webp)$/.test(u.pathname)){
    e.respondWith(caches.match(r).then(m=>{const n=fetch(r).then(x=>put(r,x)).catch(()=>m);return m||n}));return}
  e.respondWith(fetch(r).then(x=>put(r,x)).catch(()=>caches.match(r)));
});
