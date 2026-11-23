// Optional light cache. If the browser has no service-worker support, the page just works without it.
var C = 'wpr-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') { return; }
  var key = e.request.url.split('?')[0];
  e.respondWith(caches.open(C).then(function (c) {
    var net = fetch(e.request).then(function (r) { if (r && r.ok) { c.put(key, r.clone()); } return r; });
    return net.catch(function () { return c.match(key); }).then(function (r) { return r || c.match(key); });
  }));
});
