import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import type { Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | null = null;
let messaging: Messaging | null = null;

function getFirebaseApp() {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.apiKey) return null;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (messaging) return messaging;
  const fbApp = getFirebaseApp();
  if (!fbApp) return null;
  try {
    messaging = getMessaging(fbApp);
    return messaging;
  } catch {
    return null;
  }
}

export async function requestPushPermission(): Promise<string | null> {
  const fcm = getFirebaseMessaging();
  if (!fcm) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(fcm, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch {
    return null;
  }
}

export function onPushMessage(callback: (payload: { title?: string; body?: string; icon?: string; data?: Record<string, string> }) => void): (() => void) | null {
  const fcm = getFirebaseMessaging();
  if (!fcm) return null;

  return onMessage(fcm, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      icon: payload.notification?.icon,
      data: payload.data as Record<string, string> | undefined,
    });
  });
}
