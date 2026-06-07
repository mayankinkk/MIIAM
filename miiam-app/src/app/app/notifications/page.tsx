"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useNotificationStore } from "@/lib/store/notificationStore";
import Breadcrumbs from "@/components/Breadcrumbs";
import PullToRefresh from "@/components/PullToRefresh";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import SwipeableRow from "@/components/SwipeableRow";

export default function NotificationsPage() {
  const { permission, preferences, requestPermission, updatePreferences } = useNotificationStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
      console.error("Failed to fetch notifications:", error);
      addToast("Failed to load notifications. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all read:", error);
      addToast("Failed to mark notifications as read. Please try again.", "error");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <PullToRefresh onRefresh={fetchNotifications}>
    <div className="min-h-screen bg-surface pb-24">
      <header className="fixed top-0 w-full z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/app/explore" className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </Link>
            <span className="text-2xl font-extrabold text-primary">MIIAM</span>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm font-bold text-primary">
              Mark all read
            </button>
          )}
        </div>
      </header>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Notifications' }]} />

      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <section className="mb-8">
          <h1 className="text-3xl font-extrabold text-on-surface mb-1">Notifications</h1>
          <p className="text-on-surface-variant">Stay updated with your orders and offers</p>
        </section>

        {/* Push Notification Settings */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-on-surface mb-4">Push Notifications</h2>
          
          {permission === "denied" ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 font-medium">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          ) : permission === "granted" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <span className="material-symbols-outlined text-green-600">notifications_active</span>
                <div>
                  <p className="font-bold text-green-700">Notifications Enabled</p>
                  <p className="text-xs text-green-600">You'll receive updates about your orders</p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                  <div>
                    <p className="font-bold text-on-surface">Order Updates</p>
                    <p className="text-xs text-on-surface-variant">Get notified when order status changes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.orderUpdates}
                    onChange={(e) => updatePreferences({ orderUpdates: e.target.checked })}
                    className="w-5 h-5 accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                  <div>
                    <p className="font-bold text-on-surface">Promotions & Offers</p>
                    <p className="text-xs text-on-surface-variant">Receive deals and discounts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.promotions}
                    onChange={(e) => updatePreferences({ promotions: e.target.checked })}
                    className="w-5 h-5 accent-primary"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                Enable notifications to get real-time updates about your orders and exclusive offers.
              </p>
              <button
                onClick={requestPermission}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dim transition-colors"
              >
                Enable Notifications
              </button>
            </div>
          )}
        </section>

        {/* Notification History */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-4">Recent</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-surface-container-high rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-surface-container-high rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-lowest rounded-2xl">
              <span className="text-5xl">🔔</span>
              <p className="text-on-surface-variant mt-4">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <SwipeableRow
                  key={notification.id}
                  onSwipeLeft={async () => {
                    try {
                      await supabase.from("notifications").delete().eq("id", notification.id);
                      setNotifications(prev => prev.filter(n => n.id !== notification.id));
                      addToast("Notification dismissed", "success");
                    } catch {
                      addToast("Failed to dismiss notification", "error");
                    }
                  }}
                >
                  <div
                    className={`bg-surface-container-lowest rounded-2xl p-4 ${notification.read ? "opacity-70" : "border-l-4 border-primary"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === "order" ? "bg-surface-container" :
                        notification.type === "promo" ? "bg-amber-100" : "bg-surface-container-high"
                      }`}>
                        <span className="material-symbols-outlined text-lg text-primary">
                          {notification.type === "order" ? "restaurant" :
                           notification.type === "promo" ? "local_offer" : "info"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-on-surface">{notification.title}</p>
                        <p className="text-sm text-on-surface-variant mt-1">{notification.body}</p>
                        <p className="text-xs text-slate-400 mt-2">
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
