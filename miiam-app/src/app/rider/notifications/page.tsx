"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PullToRefresh from "@/components/PullToRefresh";

export default function RiderNotificationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)] p-4">
        <div className="max-w-sm text-center">
          <span className="material-symbols-outlined mb-4 block text-5xl text-red-400">
            wifi_off
          </span>
          <h2 className="mb-2 text-xl font-bold text-[var(--color-on-surface)]">
            Something went wrong
          </h2>
          <p className="mb-6 text-[var(--color-outline)]">{error}</p>
          <button
            onClick={() => loadNotifications()}
            className="bg-brand-secondary rounded-xl px-6 py-3 font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)]">
        <div className="border-brand-secondary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );

  return (
    <>
      <PullToRefresh onRefresh={loadNotifications}>
        <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
          <header className="bg-brand-secondary rounded-b-[3rem] p-6 pb-8 text-white">
            <div className="flex items-center justify-between">
              <Link href="/rider/account" className="text-white" aria-label="Go back">
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <h1 className="text-2xl font-black tracking-tighter">Notifications</h1>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="rounded-full bg-[var(--color-surface-container-lowest)]/20 px-4 py-2.5 text-sm font-bold"
                >
                  Clear All
                </button>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="mt-2 text-sm text-white/70">
                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
              </p>
            )}
          </header>

          <main className="space-y-4 p-6 pb-32">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[var(--color-outline)]">
                <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60">
                  notifications_off
                </span>
                <p className="mt-4">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg ${notif.read ? "opacity-75" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {!notif.read && (
                      <span className="bg-brand-secondary mt-2 h-3 w-3 rounded-full"></span>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-[var(--color-on-surface)]">{notif.title}</h3>
                      <p className="mt-1 text-sm text-[var(--color-outline)]">{notif.message}</p>
                      <p className="mt-2 text-xs text-[var(--color-outline-variant)]">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </main>
        </div>
      </PullToRefresh>
    </>
  );
}
