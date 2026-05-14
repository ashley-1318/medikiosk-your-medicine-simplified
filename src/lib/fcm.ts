// FCM Push Notification helper
// Requests permission, gets a device token, and saves it to Supabase
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "./firebase";

export async function requestNotificationPermission(
  userId: string,
  supabaseUpdateFn: (userId: string, token: string) => Promise<void>,
): Promise<string | null> {
  try {
    if (typeof Notification === "undefined") return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const fcmToken = await getToken(messaging, { vapidKey });

    if (fcmToken && userId) {
      await supabaseUpdateFn(userId, fcmToken);
    }

    return fcmToken;
  } catch (err) {
    console.error("[FCM] Failed to get token:", err);
    return null;
  }
}

export async function onForegroundMessage(
  callback: (payload: { title: string; body: string }) => void,
) {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "MEDIKIOSK";
    const body = payload.notification?.body ?? "";
    callback({ title, body });
  });
}
