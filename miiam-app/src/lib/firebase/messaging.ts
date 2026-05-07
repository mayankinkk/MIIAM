// Firebase imports - commented out until firebase is installed
// import { initializeApp, getApps } from "firebase/app";
// import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// let messaging: ReturnType<typeof getMessaging> | null = null;

export function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  return null;
}

export async function requestFcmToken(): Promise<string | null> {
  return null;
}

export function onForegroundMessage(callback: (payload: unknown) => void) {
  return () => {};
}