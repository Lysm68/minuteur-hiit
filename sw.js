// Garde l'appli disponible sans réseau : la copie enregistrée est servie tout de suite,
// puis remplacée en arrière-plan par la version en ligne (visible à l'ouverture suivante).
const CACHE = 'minuteur-hiit-v1';
const FICHIERS = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const copie = await cache.match(e.request, { ignoreSearch: true });
    const reseau = fetch(e.request).then(rep => {
      if (rep.ok) cache.put(e.request, rep.clone());
      return rep;
    });
    if (copie) {
      e.waitUntil(reseau.catch(() => {}));
      return copie;
    }
    return reseau;
  }));
});
