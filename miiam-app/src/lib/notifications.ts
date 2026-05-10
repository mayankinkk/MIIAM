import { createClient } from "@/lib/supabase/client";

const statusMessages: Record<string, { title: string; body: (orderId: string) => string }> = {
  accepted: {
    title: "Order Accepted! 🎉",
    body: (id) => `Your order #${id.slice(0, 8)} has been accepted by the restaurant`,
  },
  preparing: {
    title: "Preparing Your Order 👨‍🍳",
    body: (id) => `Your order #${id.slice(0, 8)} is being prepared`,
  },
  picking_up: {
    title: "Rider Picking Up 🚴",
    body: (id) => `Rider is picking up your order #${id.slice(0, 8)}`,
  },
  on_the_way: {
    title: "Order On The Way 🚗",
    body: (id) => `Your order #${id.slice(0, 8)} is on the way!`,
  },
  delivered: {
    title: "Order Delivered! 🎊",
    body: (id) => `Your order #${id.slice(0, 8)} has been delivered. Enjoy!`,
  },
  cancelled: {
    title: "Order Cancelled ❌",
    body: (id) => `Your order #${id.slice(0, 8)} has been cancelled`,
  },
};

export async function sendOrderNotification(orderId: string, status: string, userId: string) {
  const message = statusMessages[status];
  if (!message) return;

  const supabase = createClient();

  // Save to notifications table
  await supabase.from("notifications").insert({
    user_id: userId,
    title: message.title,
    message: message.body(orderId),
    type: "order_update",
    read: false,
    created_at: new Date().toISOString(),
    data: { order_id: orderId, status },
  });

  // Show browser notification if permitted
  if (typeof window !== "undefined" && Notification.permission === "granted") {
    new Notification(message.title, {
      body: message.body(orderId),
      icon: "/icon.png",
      tag: orderId,
    });
  }
}

export function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window) {
    return Notification.requestPermission();
  }
  return Promise.resolve("default");
}

export function showLocalNotification(title: string, body: string) {
  if (typeof window !== "undefined" && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/icon.png",
    });
  }
}