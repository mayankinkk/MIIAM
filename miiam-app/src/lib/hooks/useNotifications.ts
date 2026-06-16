"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  useNotificationStore,
  subscribe,
  notify,
} from "@/lib/store/notificationStore";

export function useNotifications() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const {
    notifications,
    permission,
    token: pushToken,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    unreadCount,
    requestPermission: requestNotificationPermission,
  } = useNotificationStore();

  const initializeNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      subscribe();
    }
  }, [requestNotificationPermission]);

  useEffect(() => {
    initializeNotifications();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string; email?: string } | null } }) => {
      if (!user) return;
      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload: Record<string, unknown>) => {
            const newNotification = payload.new as { title: string; body?: string; icon_url?: string; type?: string; data?: Record<string, unknown>; action_url?: string };
            addNotification({
              title: newNotification.title,
              body: newNotification.body ?? "",
              icon: newNotification.icon_url,
              tag: newNotification.type,
              data: newNotification.data,
              actionUrl: newNotification.action_url,
            });
            notify(newNotification.title, {
              body: newNotification.body,
              tag: newNotification.type,
            });
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, addNotification, initializeNotifications]);

  const sendPushNotification = useCallback(
    async (userId: string, title: string, body: string, data?: Record<string, unknown>) => {
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
      data?: Record<string, unknown>
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
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
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
        (payload: Record<string, unknown>) => {
          const order = payload.new as { status: string };
          const oldStatus = (payload.old as { status?: string })?.status;
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

          if (statusMessages[newStatus as keyof typeof statusMessages]) {
            addNotification({
              title: statusMessages[newStatus as keyof typeof statusMessages].title,
              body: statusMessages[newStatus as keyof typeof statusMessages].body,
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