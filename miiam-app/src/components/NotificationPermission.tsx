"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { notify } from "@/lib/store/notificationStore";

export default function NotificationPermission() {
  const supabase = createClient();
  const { addToast } = useToastStore();

  useEffect(() => {
    // 1. Request standard browser notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("Notification permission:", permission);
        });
      }
    }

    let isMounted = true;
    let notificationsChannel: any = null;
    let ordersChannel: any = null;

    // Play a premium system notification sound
    const playNotificationSound = () => {
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
        audio.volume = 0.5;
        audio.play();
      } catch (err) {
        console.log("Audio play blocked by browser autoplay policy");
      }
    };

    async function setupRealtimeSubscriptions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      // 2. Subscribe to custom notifications table
      notificationsChannel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as any;
            if (newNotif && isMounted) {
              playNotificationSound();
              // Show in-app animated toast
              addToast(newNotif.title + ": " + (newNotif.message || newNotif.body), "info");
              // Show native OS push notification
              notify(newNotif.title, {
                body: newNotif.message || newNotif.body,
                icon: "/icon.png",
              });
            }
          }
        )
        .subscribe();

      // 3. Subscribe to active orders for instant status change push notifications
      ordersChannel = supabase
        .channel(`user-orders-push-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const oldOrder = payload.old as any;
            const newOrder = payload.new as any;
            
            if (newOrder && oldOrder && newOrder.status !== oldOrder.status && isMounted) {
              const statusTitles: Record<string, string> = {
                pending: "Order Placed! 🛒",
                accepted: "Order Accepted! 🚴",
                preparing: "Preparing Food! 🍳",
                shopping: "Rider Shopping! 🛍️",
                picking_up: "Order Picked Up! 🛵",
                on_the_way: "Out for Delivery! 🚴",
                delivered: "Order Delivered! 🎉",
                cancelled: "Order Cancelled ❌",
              };

              const statusMessages: Record<string, string> = {
                pending: "Your order is pending confirmation",
                accepted: "A delivery hero has accepted your order",
                preparing: "The merchant is cooking/preparing your items",
                shopping: "Rider is picking up the items from your list",
                picking_up: "Rider is picking up from the store",
                on_the_way: "Rider is heading to your delivery address!",
                delivered: "Your order has been delivered successfully. Enjoy!",
                cancelled: "Your order has been cancelled.",
              };

              const title = statusTitles[newOrder.status] || "Order Update";
              const message = statusMessages[newOrder.status] || `Your order status changed to ${newOrder.status}`;

              playNotificationSound();
              addToast(`${title} - ${message}`, "success");
              notify(title, {
                body: message,
                icon: "/icon.png",
              });
            }
          }
        )
        .subscribe();
    }

    setupRealtimeSubscriptions();

    return () => {
      isMounted = false;
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
      if (ordersChannel) supabase.removeChannel(ordersChannel);
    };
  }, []);

  return null;
}