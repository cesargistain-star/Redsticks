// RedSticks · service worker
// Cambia CACHE en cada version publicada: es lo que avisa a los iPads de que hay version nueva.
var CACHE='redsticks-v36';
var FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','icon-512-maskable.png'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(FILES.map(function(f){
      return fetch(f,{cache:'reload'}).then(function(r){ if(!r.ok) throw new Error(f+' '+r.status); return c.put(f,r); });
    }));
  }));
  // Sin skipWaiting: una version nueva espera a que el usuario pulse "Actualizar ahora".
});

self.addEventListener('message',function(e){
  if(e.data&&e.data.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k.indexOf('redsticks-')===0&&k!==CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

// Primero la copia guardada (funciona sin wifi); la red solo si falta algo.
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET') return;
  var u=new URL(e.request.url);
  if(u.origin!==location.origin) return;
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(e.request,{ignoreSearch:true}).then(function(hit){
      if(hit) return hit;
      if(e.request.mode==='navigate') return c.match('index.html').then(function(i){ return i||fetch(e.request); });
      return fetch(e.request);
    });
  }));
});
