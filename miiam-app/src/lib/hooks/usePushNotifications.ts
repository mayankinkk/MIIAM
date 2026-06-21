"use client";

import { useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationStore } from "@/lib/store/notificationStore";
import logger from "@/lib/logger";

export function usePushNotifications(userId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setPermission, permission } = useNotificationStore();
  const supabase = useMemo(() => createClient(), []);

  const subscribe = useCallback(async () => {
    if (!userId) {
      setError("User not logged in");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const browserPermission = await Notification.requestPermission();
      setPermission(browserPermission);

      if (browserPermission !== "granted") {
        setError("Notification permission denied");
        setIsLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }

      const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!VAPID_PUBLIC_KEY) {
        logger.warn("VAPID public key not configured, push subscription skipped");
        setIsLoading(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription }),
      });

      setIsLoading(false);
    } catch (err) {
      logger.error({ err }, "Notification setup error");
      setError("Failed to setup notifications");
      setIsLoading(false);
    }
  }, [userId, setPermission]);

  const sendNotification = useCallback(async (
    title: string,
    message: string,
    type?: string,
    actionUrl?: string
  ) => {
    if (!userId) return;

    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, body: message, type, actionUrl }),
      });
      return response.json();
    } catch (err) {
      logger.error({ err }, "Failed to send notification");
    }
  }, [userId]);

  const fetchHistory = useCallback(async () => {
    if (!userId) return [];
    try {
      const response = await fetch(`/api/notifications/send?userId=${userId}`);
      const data = await response.json();
      return data.notifications || [];
    } catch (err) {
      logger.error({ err }, "Failed to fetch notifications");
      return [];
    }
  }, [userId]);

  return { subscribe, sendNotification, fetchHistory, isLoading, error, permission };
}

export const NotificationType = {
  ORDER_CONFIRMED: "order_confirmed",
  ORDER_COMPLETED: "order_completed",
  PROMO: "promo",
  BOOKING_REMINDER: "booking_reminder",
  PAYMENT: "payment",
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];