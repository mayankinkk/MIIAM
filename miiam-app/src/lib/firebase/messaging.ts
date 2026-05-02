import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let messaging: ReturnType<typeof getMessaging> | null = null;

export function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  
  if (!messaging) {
    try {
      messaging = getMessaging();
    } catch (e) {
      console.error("Failed to get messaging:", e);
      return null;
    }
  }
  
  return messaging;
}

export async function requestFcmToken(): Promise<string | null> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    
    return token;
  } catch (error) {
    console.error("Failed to get FCM token:", error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}