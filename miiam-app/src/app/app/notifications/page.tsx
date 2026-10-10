"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";
import { useNotificationStore } from "@/lib/store/notificationStore";
import Breadcrumbs from "@/components/Breadcrumbs";
import PullToRefresh from "@/components/PullToRefresh";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import SwipeableRow from "@/components/SwipeableRow";

interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { permission, preferences, requestPermission, updatePreferences } = useNotificationStore();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const { addToast } = useToastStore();
  const { confirm } = useConfirm();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifications(data || []);
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Failed to fetch notifications"
      );
      addToast("Failed to load notifications. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Failed to mark all read"
      );
      addToast("Failed to mark notifications as read. Please try again.", "error");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <PullToRefresh onRefresh={fetchNotifications}>
      <div className="bg-surface min-h-screen pb-24">
        <header className="bg-surface-container-lowest fixed top-0 z-50 w-full shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/app/home"
                aria-label="Go back"
                className="bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-full"
              >
                <span className="material-symbols-outlined text-accent">arrow_back</span>
              </Link>
              <span className="text-accent text-2xl font-extrabold">MIIAM</span>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-accent text-sm font-bold">
                Mark all read
              </button>
            )}
          </div>
        </header>

        <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Notifications" }]} />

        <main className="mx-auto max-w-2xl px-6 pt-20">
          <section className="mb-8">
            <h1 className="text-on-surface mb-1 text-3xl font-extrabold">Notifications</h1>
            <p className="text-on-surface-variant">Stay updated with your orders and offers</p>
          </section>

          {/* Push Notification Settings */}
          <section className="bg-surface-container-lowest mb-8 rounded-2xl p-6 shadow-sm">
            <h2 className="text-on-surface mb-4 text-lg font-bold">Push Notifications</h2>

            {permission === "denied" ? (
              <div className="bg-error/10 border-error/20 rounded-xl border p-4">
                <p className="text-error text-sm font-medium">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              </div>
            ) : permission === "granted" ? (
              <div className="space-y-4">
                <div className="bg-status-success/10 border-status-success/20 flex items-center gap-3 rounded-xl border p-4">
                  <span className="material-symbols-outlined text-status-success">
                    notifications_active
                  </span>
                  <div>
                    <p className="text-status-success font-bold">Notifications Enabled</p>
                    <p className="text-on-surface-variant text-xs">
                      You'll receive updates about your orders
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="bg-surface-container-low flex cursor-pointer items-center justify-between rounded-xl p-4">
                    <div>
                      <p className="text-on-surface font-bold">Order Updates</p>
                      <p className="text-on-surface-variant text-xs">
                        Get notified when order status changes
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.orderUpdates}
                      onChange={(e) => updatePreferences({ orderUpdates: e.target.checked })}
                      className="accent-primary h-5 w-5"
                    />
                  </label>
                  <label className="bg-surface-container-low flex cursor-pointer items-center justify-between rounded-xl p-4">
                    <div>
                      <p className="text-on-surface font-bold">Promotions & Offers</p>
                      <p className="text-on-surface-variant text-xs">Receive deals and discounts</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.promotions}
                      onChange={(e) => updatePreferences({ promotions: e.target.checked })}
                      className="accent-primary h-5 w-5"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-on-surface-variant text-sm">
                  Enable notifications to get real-time updates about your orders and exclusive
                  offers.
                </p>
                <button
                  onClick={requestPermission}
                  className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary w-full rounded-xl py-4 font-bold transition-colors"
                >
                  Enable Notifications
                </button>
              </div>
            )}
          </section>

          {/* Notification History */}
          <section>
            <h2 className="text-on-surface mb-4 text-lg font-bold">Recent</h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-container-lowest animate-pulse rounded-2xl p-4"
                  >
                    <div className="bg-surface-container-high mb-2 h-4 w-3/4 rounded"></div>
                    <div className="bg-surface-container-high h-3 w-1/2 rounded"></div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl py-12 text-center">
                <span className="text-5xl">🔔</span>
                <p className="text-on-surface-variant mt-4">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <SwipeableRow
                    key={notification.id}
                    onSwipeLeft={async () => {
                      if (
                        !(await confirm({
                          title: "Delete Notification",
                          message: "Remove this notification?",
                          variant: "danger",
                        }))
                      )
                        return;
                      try {
                        await supabase.from("notifications").delete().eq("id", notification.id);
                        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
                        addToast("Notification dismissed", "success");
                      } catch {
                        addToast("Failed to dismiss notification", "error");
                      }
                    }}
                  >
                    <div
                      className={`bg-surface-container-lowest rounded-2xl p-4 ${notification.is_read ? "opacity-70" : "border-primary border-l-4"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            notification.type === "order"
                              ? "bg-surface-container-high"
                              : notification.type === "promo"
                                ? "bg-amber-100 dark:bg-amber-900/30"
                                : "bg-surface-container"
                          }`}
                        >
                          <span className="material-symbols-outlined text-accent text-lg">
                            {notification.type === "order"
                              ? "restaurant"
                              : notification.type === "promo"
                                ? "local_offer"
                                : "info"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-on-surface font-bold">{notification.title}</p>
                          <p className="text-on-surface-variant mt-1 text-sm">
                            {notification.body}
                          </p>
                          <p className="text-on-surface-variant/60 mt-2 text-xs">
                            {new Date(notification.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </SwipeableRow>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </PullToRefresh>
  );
}
