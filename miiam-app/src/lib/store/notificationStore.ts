"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  recommendations: boolean;
}

interface NotificationStore {
  permission: NotificationPermission | "default" | "unknown";
  token: string | null;
  preferences: NotificationPreferences;
  requestPermission: () => Promise<boolean>;
  setToken: (token: string) => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      permission: "default",
      token: null,
      preferences: {
        orderUpdates: true,
        promotions: true,
        recommendations: false,
      },

      requestPermission: async () => {
        if (!("Notification" in window)) {
          console.log("Notifications not supported");
          return false;
        }
        
        const currentPermission = Notification.permission;
        if (currentPermission === "granted") {
          set({ permission: "granted" });
          await get().subscribe();
          return true;
        }
        
        if (currentPermission === "denied") {
          set({ permission: "denied" });
          return false;
        }

        try {
          const permission = await Notification.requestPermission();
          set({ permission });
          if (permission === "granted") {
            await get().subscribe();
          }
          return permission === "granted";
        } catch (error) {
          console.error("Notification permission error:", error);
          return false;
        }
      },

      setToken: (token) => set({ token }),

      updatePreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs },
      })),
    }),
    { name: "miiam-notifications" }
  )
);

export async function subscribe() {
  const store = useNotificationStore.getState();
  if (store.permission !== "granted" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    
    if (existingSubscription) {
      store.setToken(existingSubscription.endpoint);
      return existingSubscription;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.log("VAPID public key not configured");
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    
    store.setToken(subscription.endpoint);
    return subscription;
  } catch (error) {
    console.error("Push subscription error:", error);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function notify(title: string, options?: NotificationOptions) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/icons/icon-192.png",
      badge: "/icons/badge.png",
      ...options,
    });
  }
}
