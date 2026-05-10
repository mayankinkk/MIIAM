"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationStore } from "@/lib/store/notificationStore";

export function usePushNotifications(userId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setPermission, permission } = useNotificationStore();
  const supabase = createClient();

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

      console.log("Browser notifications enabled");
      setIsLoading(false);
    } catch (err) {
      console.error("Notification setup error:", err);
      setError("Failed to setup notifications");
      setIsLoading(false);
    }
  }, [userId, supabase, setPermission]);

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
      console.error("Failed to send notification:", err);
    }
  }, [userId]);

  const fetchHistory = useCallback(async () => {
    if (!userId) return [];
    try {
      const response = await fetch(`/api/notifications/send?userId=${userId}`);
      const data = await response.json();
      return data.notifications || [];
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
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