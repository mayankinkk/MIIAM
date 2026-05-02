"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  useNotificationStore,
  requestNotificationPermission,
  subscribeToPushNotifications,
  showLocalNotification,
} from "@/lib/store/notificationStore";

export function useNotifications() {
  const supabase = createClient();
  const {
    notifications,
    permission,
    pushToken,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    unreadCount,
  } = useNotificationStore();

  const initializeNotifications = useCallback(async () => {
    const perm = await requestNotificationPermission();
    if (perm === "granted") {
      subscribeToPushNotifications();
    }
  }, []);

  useEffect(() => {
    initializeNotifications();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotification = payload.new as any;
          addNotification({
            title: newNotification.title,
            body: newNotification.body,
            icon: newNotification.icon_url,
            tag: newNotification.type,
            data: newNotification.data,
            actionUrl: newNotification.action_url,
          });
          showLocalNotification(newNotification.title, {
            body: newNotification.body,
            tag: newNotification.type,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, addNotification, initializeNotifications]);

  const sendPushNotification = useCallback(
    async (userId: string, title: string, body: string, data?: Record<string, any>) => {
      const { data: result, error } = await supabase.functions.invoke(
        "send-notification",
        {
          body: {
            user_id: userId,
            title,
            body,
            data,
          },
        }
      );

      if (error) {
        console.error("Failed to send push notification:", error);
      }

      return result;
    },
    [supabase]
  );

  const scheduleNotification = useCallback(
    async (
      userId: string,
      title: string,
      body: string,
      scheduledAt: Date,
      data?: Record<string, any>
    ) => {
      const { error } = await supabase.from("scheduled_notifications").insert({
        user_id: userId,
        title,
        body,
        scheduled_at: scheduledAt.toISOString(),
        data: JSON.stringify(data),
      });

      if (error) {
        console.error("Failed to schedule notification:", error);
      }
    },
    [supabase]
  );

  return {
    notifications,
    permission,
    pushToken,
    unreadCount: unreadCount(),
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    sendPushNotification,
    scheduleNotification,
    requestPermission: initializeNotifications,
  };
}

export function useOrderNotifications(orderId: string) {
  const supabase = createClient();
  const { addNotification, markAsRead } = useNotificationStore();

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const order = payload.new as any;
          const oldStatus = payload.old?.status;
          const newStatus = order.status;

          const statusMessages: Record<string, { title: string; body: string }> = {
            accepted: {
              title: "Order Accepted! 🎉",
              body: "Your order has been confirmed by the restaurant",
            },
            preparing: {
              title: "Preparing Your Order 👨‍🍳",
              body: "The restaurant is preparing your food",
            },
            picked_up: {
              title: "Order Picked Up 🚴",
              body: "Rider has picked up your order",
            },
            on_the_way: {
              title: "On the Way 🚀",
              body: "Your order is en route to you",
            },
            delivered: {
              title: "Delivered! 🎊",
              body: "Your order has been delivered. Enjoy!",
            },
            cancelled: {
              title: "Order Cancelled",
              body: "Your order has been cancelled",
            },
          };

          if (statusMessages[newStatus]) {
            addNotification({
              title: statusMessages[newStatus].title,
              body: statusMessages[newStatus].body,
              tag: "order_update",
              actionUrl: `/app/orders/${orderId}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase, addNotification]);
}