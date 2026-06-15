"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PullToRefresh from "@/components/PullToRefresh";

export default function RiderNotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data, error: notifError } = await supabase
        .from("rider_notifications")
        .select("*")
        .eq("rider_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (notifError) throw new Error(notifError.message);

      setNotifications(data || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [supabase]);

  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from("rider_notifications")
      .update({ read: true })
      .eq("rider_id", userId)
      .eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">wifi_off</span>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Something went wrong</h2>
          <p className="text-[var(--color-outline)] mb-6">{error}</p>
          <button
            onClick={() => loadNotifications()}
            className="px-6 py-3 bg-[#0b50d5] text-white rounded-xl font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#0b50d5] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
    <PullToRefresh onRefresh={loadNotifications}>
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="bg-[#0b50d5] text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex items-center justify-between">
          <Link href="/rider/account" className="text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm font-bold bg-[var(--color-surface-container-lowest)]/20 px-4 py-2.5 rounded-full">
              Clear All
            </button>
          )}
        </div>
        {unreadCount > 0 && (
          <p className="text-sm text-white/70 mt-2">{unreadCount} unread notification{unreadCount > 1 ? "s" : ""}</p>
        )}
      </header>

      <main className="p-6 space-y-4 pb-32">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-outline)]">
            <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60">notifications_off</span>
            <p className="mt-4">No notifications yet</p>
          </div>
        ) : notifications.map((notif) => (
          <div
            key={notif.id}
            className={`bg-[var(--color-surface-container-lowest)] p-4 rounded-2xl shadow-lg ${notif.read ? "opacity-75" : ""}`}
          >
            <div className="flex items-start gap-3">
              {!notif.read && (
                <span className="w-3 h-3 bg-[#0b50d5] rounded-full mt-2"></span>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-[var(--color-on-surface)]">{notif.title}</h3>
                <p className="text-sm text-[var(--color-outline)] mt-1">{notif.message}</p>
                <p className="text-xs text-[var(--color-outline-variant)] mt-2">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </main>

    </div>
    </PullToRefresh>

    </>
  );
}