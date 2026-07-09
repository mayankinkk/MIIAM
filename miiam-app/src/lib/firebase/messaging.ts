// Firebase messaging stub — safe no-op when firebase is not installed

import logger from "@/lib/logger";

export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  logger.warn("Firebase messaging not configured — push notifications disabled");
  return null;
}

export function onForegroundMessage(_callback: (payload: unknown) => void): () => void {
  return () => {};
}

export function getFirebaseMessaging() {
  return null;
}
