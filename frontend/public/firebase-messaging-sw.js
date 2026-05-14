// Firebase background messaging service worker
// Must be at /public/firebase-messaging-sw.js to be picked up by browsers

importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

// These values are injected at build time via the env substitution below.
// Since service workers can't use import.meta.env, we embed them directly.
// Replace with your actual values — SW files cannot use Vite env vars.
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: self.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: self.FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: self.FIREBASE_APP_ID || "YOUR_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = "MEDIKIOSK", body = "" } = payload.notification ?? {};
  self.registration.showNotification(title, {
    body,
    icon: "/medikiosk-icon.png",
    badge: "/medikiosk-icon.png",
  });
});
