"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { createClient } from "@/lib/supabase/client";

export default function NotificationsPage() {
  const { permission, preferences, requestPermission, updatePreferences } = useNotificationStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      <header className="fixed top-0 w-full z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/app/explore" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
            </Link>
            <span className="text-2xl font-extrabold text-[#ba001c]">MIIAM</span>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm font-bold text-[#ba001c]">
              Mark all read
            </button>
          )}
        </div>
      </header>

      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <section className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#4d212a] mb-1">Notifications</h1>
          <p className="text-[#814c55]">Stay updated with your orders and offers</p>
        </section>

        {/* Push Notification Settings */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-[#4d212a] mb-4">Push Notifications</h2>
          
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
                    <p className="font-bold text-[#4d212a]">Order Updates</p>
                    <p className="text-xs text-[#814c55]">Get notified when order status changes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.orderUpdates}
                    onChange={(e) => updatePreferences({ orderUpdates: e.target.checked })}
                    className="w-5 h-5 accent-[#ba001c]"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                  <div>
                    <p className="font-bold text-[#4d212a]">Promotions & Offers</p>
                    <p className="text-xs text-[#814c55]">Receive deals and discounts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.promotions}
                    onChange={(e) => updatePreferences({ promotions: e.target.checked })}
                    className="w-5 h-5 accent-[#ba001c]"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#814c55]">
                Enable notifications to get real-time updates about your orders and exclusive offers.
              </p>
              <button
                onClick={requestPermission}
                className="w-full py-4 bg-[#ba001c] text-white font-bold rounded-xl hover:bg-[#a40017] transition-colors"
              >
                Enable Notifications
              </button>
            </div>
          )}
        </section>

        {/* Notification History */}
        <section>
          <h2 className="text-lg font-bold text-[#4d212a] mb-4">Recent</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <span className="text-5xl">🔔</span>
              <p className="text-[#814c55] mt-4">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl p-4 ${notification.read ? "opacity-70" : "border-l-4 border-[#ba001c]"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      notification.type === "order" ? "bg-[#ffe1e4]" :
                      notification.type === "promo" ? "bg-amber-100" : "bg-slate-100"
                    }`}>
                      <span className="material-symbols-outlined text-lg text-[#ba001c]">
                        {notification.type === "order" ? "restaurant" :
                         notification.type === "promo" ? "local_offer" : "info"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#4d212a]">{notification.title}</p>
                      <p className="text-sm text-[#814c55] mt-1">{notification.body}</p>
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
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
