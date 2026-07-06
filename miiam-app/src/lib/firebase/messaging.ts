// Firebase messaging stub — replace with real Firebase config when ready

export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch {
    console.warn("Firebase messaging not available — push notifications disabled");
    return null;
  }
}

export function onForegroundMessage(callback: (payload: unknown) => void): () => void {
  if (typeof window === "undefined") return () => {};
  try {
    const { getMessaging, onMessage } = require("firebase/messaging");
    const messaging = getMessaging();
    return onMessage(messaging, callback);
  } catch {
    console.warn("Firebase messaging not available — foreground listener skipped");
    return () => {};
  }
}

export function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  try {
    const { getMessaging } = require("firebase/messaging");
    return getMessaging();
  } catch {
    return null;
  }
}
