"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

interface NotificationStore {
  notifications: PushNotification[];
  permission: NotificationPermission | null;
  pushToken: string | null;
  addNotification: (notification: Omit<PushNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setPermission: (permission: NotificationPermission) => void;
  setPushToken: (token: string) => void;
  unreadCount: () => number;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      permission: null,
      pushToken: null,

      addNotification: (notification) => {
        const newNotification: PushNotification = {
          ...notification,
          id: generateId(),
          timestamp: Date.now(),
          read: false,
        };
        set({ notifications: [newNotification, ...get().notifications] });
        
        if (notification.actionUrl) {
          console.log(`[Push Notification] Navigate to: ${notification.actionUrl}`);
        }
      },

      markAsRead: (id) => {
        set({
          notifications: get().notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        });
      },

      markAllAsRead: () => {
        set({
          notifications: get().notifications.map((n) => ({ ...n, read: true })),
        });
      },

      removeNotification: (id) => {
        set({
          notifications: get().notifications.filter((n) => n.id !== id),
        });
      },

      clearAll: () => set({ notifications: [] }),

      setPermission: (permission) => set({ permission }),

      setPushToken: (token) => set({ pushToken: token }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: "miiam-notifications" }
  )
);

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return "denied";
  }

  const permission = await Notification.requestPermission();
  useNotificationStore.getState().setPermission(permission);
  return permission;
}

export function subscribeToPushNotifications() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers not supported");
    return;
  }

  if (!("PushManager" in window)) {
    console.warn("Push messaging not supported");
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
      ),
    }).then((subscription) => {
      console.log("Push subscription successful:", subscription);
      useNotificationStore.getState().setPushToken(subscription.endpoint);
    }).catch((err) => {
      console.error("Push subscription failed:", err);
    });
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/icon.png",
      badge: "/badge.png",
      ...options,
    });
  }
}