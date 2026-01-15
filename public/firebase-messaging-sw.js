// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBvFM13K0XadCnAHdHE0C5GtA2TH5DaqLg",
  projectId: "familias-church",
  messagingSenderId: "764183777206",
  appId: "1:764183777206:web:758e4f04ee24b86229bb17",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Mensagem recebida em segundo plano: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png', // Use the PNG icon for better compatibility
    badge: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});