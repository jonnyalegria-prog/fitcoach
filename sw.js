// Service worker: la app abre sin conexión. Red primero (siempre la última versión), caché como respaldo.
const CACHE = 'fitcoach-v2';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css', 'vendor/supabase.js',
  'js/app.js', 'js/nav.js', 'js/api.js', 'js/ui.js', 'js/util.js', 'js/exercises.js', 'js/planner.js', 'js/coach.js', 'js/ai.js',
  'js/views/auth.js', 'js/views/onboarding.js', 'js/views/home.js', 'js/views/plan.js', 'js/views/workout.js',
  'js/views/progress.js', 'js/views/profile.js', 'js/views/exercise-sheet.js', 'js/views/chat.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // Supabase y demás van directo a la red
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
  );
});
