"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestFcmToken, onForegroundMessage } from "@/lib/firebase/messaging";
import { useNotificationStore, showLocalNotification } from "@/lib/store/notificationStore";

export function usePushNotifications(userId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification, setPermission, permission } = useNotificationStore();
  const supabase = createClient();

  // Request permission and get token
  const subscribe = useCallback(async () => {
    if (!userId) {
      setError("User not logged in");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request browser notification permission
      const browserPermission = await Notification.requestPermission();
      setPermission(browserPermission);

      if (browserPermission !== "granted") {
        setError("Notification permission denied");
        setIsLoading(false);
        return;
      }

      // Try to get FCM token
      const fcmToken = await requestFcmToken();

      if (fcmToken) {
        // Save token to database
        await supabase.from("user_push_tokens").upsert(
          {
            user_id: userId,
            token: fcmToken,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        console.log("FCM token saved:", fcmToken.substring(0, 20) + "...");
      }

      // Listen for foreground messages
      const unsubscribe = onForegroundMessage((payload: unknown) => {
        const payloadWithType = payload as { notification?: { title?: string; body?: string; icon?: string }; data?: Record<string, string> };
        const { notification, data } = payloadWithType;
        
        if (notification) {
          const title = notification.title || "";
          const body = notification.body || "";
          
          // Show local notification
          showLocalNotification(title, {
            body,
            icon: notification.icon,
            tag: data?.type,
          });

          // Add to store
          addNotification({
            title,
            body,
            icon: notification.icon,
            data,
            actionUrl: data?.actionUrl,
          });
        }
      });

      setIsLoading(false);
      return () => unsubscribe();
    } catch (err) {
      console.error("Push notification setup error:", err);
      setError("Failed to setup notifications");
      setIsLoading(false);
    }
  }, [userId, supabase, addNotification, setPermission]);

  // Send notification
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
        body: JSON.stringify({
          userId,
          title,
          body: message,
          type,
          actionUrl,
        }),
      });

      return response.json();
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  }, [userId]);

  // Fetch notification history
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

  return {
    subscribe,
    sendNotification,
    fetchHistory,
    isLoading,
    error,
    permission,
  };
}

// Service types for notifications
export const NotificationType = {
  ORDER_CONFIRMED: "order_confirmed",
  ORDER_COMPLETED: "order_completed",
  PROMO: "promo",
  BOOKING_REMINDER: "booking_reminder",
  PAYMENT: "payment",
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];