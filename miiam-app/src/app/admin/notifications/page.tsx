"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: "order" | "promo" | "system";
  is_read: boolean;
  created_at: string;
}

export default function NotificationCenter() {
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [newNotification, setNewNotification] = useState({ title: "", body: "", type: "system" as const });

  useEffect(() => {
    loadNotifications();
  }, [supabase]);

  async function loadNotifications() {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    if (data) setNotifications(data);
    setLoading(false);
  }

  async function sendNotification() {
    if (!newNotification.title || !newNotification.body) return;
    
    const { data: users } = await supabase.from("profiles").select("id");
    
    if (users) {
      const notifications = users.map((u: { id: string }) => ({
        user_id: u.id,
        title: newNotification.title,
        body: newNotification.body,
        type: newNotification.type,
        is_read: false
      }));
      
      await supabase.from("notifications").insert(notifications);
    }
    
    setShowSend(false);
    setNewNotification({ title: "", body: "", type: "system" });
    loadNotifications();
  }

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    loadNotifications();
  }

  async function markAllAsRead() {
    await supabase.from("notifications").update({ is_read: true });
    loadNotifications();
  }

  async function deleteNotification(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(notifications.filter(n => n.id !== id));
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const typeIcons = { order: "shopping_cart", promo: "local_offer", system: "settings" };

  if (loading) return <div className="px-8">Loading notifications...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-2">Notification Center</h1>
          <p className="text-[var(--color-outline)]">Send and manage push notifications.</p>
        </div>
        <button 
          onClick={() => setShowSend(true)}
          className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/10 hover:scale-105 active:scale-95 transition-all"
        >
          + Send Notification
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Total</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{notifications.length}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100 shadow-sm">
          <p className="text-xs font-black text-yellow-600 uppercase tracking-widest mb-1">Unread</p>
          <p className="text-3xl font-black text-yellow-600">{unreadCount}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Order Alerts</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{notifications.filter(n => n.type === "order").length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Promotions</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{notifications.filter(n => n.type === "promo").length}</p>
        </div>
      </div>

      {unreadCount > 0 && (
        <button 
          onClick={markAllAsRead}
          className="text-sm font-bold text-[var(--color-primary)] hover:underline"
        >
          Mark all as read
        </button>
      )}

      {/* Notifications List */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-4 flex items-start gap-4 hover:bg-[var(--color-surface-subtle)] transition-colors ${!notification.is_read ? "bg-blue-50/30" : ""}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                notification.type === "order" ? "bg-blue-100" :
                notification.type === "promo" ? "bg-amber-100" : "bg-[var(--color-surface-container)]"
              }`}>
                <span className={`material-symbols-outlined ${
                  notification.type === "order" ? "text-blue-600" :
                  notification.type === "promo" ? "text-amber-600" : "text-[var(--color-on-surface-variant)]"
                }`}>
                  {typeIcons[notification.type]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[var(--color-on-surface)]">{notification.title}</p>
                  {!notification.is_read && (
                    <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-[var(--color-outline)] truncate">{notification.body}</p>
                <p className="text-xs text-[var(--color-outline-variant)] mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!notification.is_read && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="text-[var(--color-outline-variant)] hover:text-[var(--color-primary)] p-2"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(notification.id)}
                  className="text-[var(--color-outline-variant)] hover:text-red-500 p-2"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="p-8 text-center text-[var(--color-outline-variant)]">
              No notifications yet
            </div>
          )}
        </div>
      </div>

      {/* Send Notification Modal */}
      {showSend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl max-w-md w-full">
            <div className="p-6 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
              <h2 className="text-xl font-black text-[var(--color-on-surface)]">Send Notification</h2>
              <button onClick={() => setShowSend(false)} className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10"
                  placeholder="Notification title"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Message</label>
                <textarea
                  value={newNotification.body}
                  onChange={(e) => setNewNotification({ ...newNotification, body: e.target.value })}
                  className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10"
                  rows={3}
                  placeholder="Notification message"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Type</label>
                <select
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                  className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10"
                >
                  <option value="system">System</option>
                  <option value="order">Order</option>
                  <option value="promo">Promotion</option>
                </select>
              </div>
              <button
                onClick={sendNotification}
                className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:bg-[#a00018]"
              >
                Send to All Users
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}