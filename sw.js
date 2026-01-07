const CACHE_NAME = 'glicosync-cache-v20';

self.addEventListener('install', (event) => {
  // Força o SW a ativar imediatamente, não esperando abas fecharem
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Reivindica o controle de todos os clientes abertos imediatamente
  event.waitUntil(clients.claim());
  
  // Limpeza de caches antigos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são HTTP/HTTPS (ex: chrome-extension://)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Estratégia: Network First, falling back to Cache
  // Isso garante que o app sempre tente pegar a versão mais nova, 
  // mas funcione offline se já tiver acessado a página antes.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Retorna resposta da rede e guarda uma cópia no cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Se rede falhar, tenta o cache
        return caches.match(event.request).then((response) => {
          if (response) {
             return response;
          }
          // Fallback para index.html se for navegação de página
          if (event.request.mode === 'navigate') {
             return caches.match('./index.html');
          }
        });
      })
  );
});