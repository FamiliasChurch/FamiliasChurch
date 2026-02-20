// Service Worker para o sistema Famílias Church
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBvFM13K0XadCnAHdHE0C5GtA2TH5DaqLg",
  projectId: "familias-church",
  messagingSenderId: "764183777206",
  appId: "1:764183777206:web:758e4f04ee24b86229bb17",
});

const messaging = firebase.messaging();

// 1. Lógica para processar mensagens recebidas com o app fechado
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mensagem recebida em segundo plano:', payload);
  
  const notificationTitle = payload.notification?.title || "Famílias Church - Alerta";
  const notificationOptions = {
    body: payload.notification?.body || "Você tem uma nova atualização no sistema.",
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png', // Ícone da barra de status
    tag: 'encontro-notificacao', // Agrupa notificações similares
    renotify: true, // Faz o celular vibrar novamente para novos alertas de medicação
    data: {
      url: payload.data?.url || '/' // Direciona para o dashboard ou estudo específico
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2. Lógica para quando o usuário CLICA na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Fecha a notificação
  
  const targetUrl = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver uma aba aberta, foca nela
      for (let client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não houver aba aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});