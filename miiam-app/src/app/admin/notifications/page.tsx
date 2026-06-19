"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: "order" | "promo" | "system";
  is_read: boolean;
  created_at: string;
}

const TEMPLATES = [
  { label: "Custom", value: "custom", title: "", body: "" },
  { label: "Welcome Message", value: "welcome", title: "Welcome to MIIAM!", body: "Thank you for joining MIIAM! Explore our wide range of food, grocery, and print services. Start ordering now and enjoy exclusive offers." },
  { label: "Order Update", value: "order_update", title: "Order Update", body: "Your order has been updated. Check the app for the latest status and delivery details." },
  { label: "Promotional Offer", value: "promo", title: "Special Offer Just for You!", body: "Get 20% off on your next order! Use code MIIAM20 at checkout. Valid for the next 48 hours only." },
  { label: "System Maintenance", value: "maintenance", title: "Scheduled Maintenance", body: "We'll be performing scheduled maintenance on our systems. Some services may be temporarily unavailable. We apologize for the inconvenience." },
];

type SegmentType = "all" | "active" | "new" | "role" | "service";

export default function NotificationCenter() {
  const supabase = useMemo(() => createClient(), []);
  const addToast = useToastStore((s) => s.addToast);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [newNotification, setNewNotification] = useState<{
    title: string;
    body: string;
    type: Notification["type"];
    template: string;
  }>({
    title: "",
    body: "",
    type: "system",
    template: "custom",
  });
  const [segment, setSegment] = useState<SegmentType>("all");
  const [roleFilter, setRoleFilter] = useState("user");
  const [serviceFilter, setServiceFilter] = useState("food");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    loadNotifications();
  }, [supabase]);

  async function loadNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data);
    setLoading(false);
  }

  async function getRecipientIds(): Promise<string[]> {
    let query = supabase.from("profiles").select("id");

    if (segment === "active") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("last_login", sevenDaysAgo);
    } else if (segment === "new") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", sevenDaysAgo);
    } else if (segment === "role") {
      query = query.eq("role", roleFilter);
    } else if (segment === "service") {
      query = query.eq("preferred_service", serviceFilter);
    }

    const { data: users } = await query;
    return users ? users.map((u: { id: string }) => u.id) : [];
  }

  async function sendNotification() {
    if (!newNotification.title || !newNotification.body) {
      addToast("Please fill in both title and message", "error");
      return;
    }

    const userIds = await getRecipientIds();

    if (userIds.length === 0) {
      addToast("No recipients matched the selected segment", "error");
      return;
    }

    if (scheduleEnabled && scheduledAt) {
      await supabase.from("scheduled_notifications").insert({
        title: newNotification.title,
        body: newNotification.body,
        type: newNotification.type,
        segment,
        role_filter: segment === "role" ? roleFilter : null,
        service_filter: segment === "service" ? serviceFilter : null,
        scheduled_at: scheduledAt,
        recipient_count: userIds.length,
      });
      addToast(`Notification scheduled for ${new Date(scheduledAt).toLocaleString()} for ${userIds.length} users`, "success");
    } else {
      const { error } = await supabase.from("notifications").insert(
        userIds.map((id) => ({
          user_id: id,
          title: newNotification.title,
          body: newNotification.body,
          type: newNotification.type,
          is_read: false,
        }))
      );
      if (error) {
        addToast("Failed to send notification", "error");
        return;
      }
      addToast(`Notification sent to ${userIds.length} users`, "success");
    }

    setShowSend(false);
    setNewNotification({ title: "", body: "", type: "system", template: "custom" });
    setSegment("all");
    setScheduleEnabled(false);
    setScheduledAt("");
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
    setNotifications(notifications.filter((n) => n.id !== id));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const typeIcons: Record<string, string> = { order: "shopping_cart", promo: "local_offer", system: "settings" };

  function handleTemplateChange(templateValue: string) {
    const tpl = TEMPLATES.find((t) => t.value === templateValue);
    if (tpl) {
      setNewNotification((prev) => ({
        ...prev,
        template: templateValue,
        title: tpl.title,
        body: tpl.body,
      }));
    }
  }

  function getSegmentLabel(): string {
    switch (segment) {
      case "all":
        return "All Users";
      case "active":
        return "Active Users (last 7 days)";
      case "new":
        return "New Users (last 7 days)";
      case "role":
        return `By Role: ${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}`;
      case "service":
        return `By Service: ${serviceFilter.charAt(0).toUpperCase() + serviceFilter.slice(1)}`;
      default:
        return "All Users";
    }
  }

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Total</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{notifications.length}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-3xl border border-yellow-100 dark:border-yellow-800/30 shadow-sm">
          <p className="text-xs font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1">Unread</p>
          <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400">{unreadCount}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Order Alerts</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{notifications.filter((n) => n.type === "order").length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Promotions</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{notifications.filter((n) => n.type === "promo").length}</p>
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

      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 flex items-start gap-4 hover:bg-[var(--color-surface-subtle)] transition-colors ${!notification.is_read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.type === "order"
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : notification.type === "promo"
                      ? "bg-amber-100 dark:bg-amber-900/30"
                      : "bg-[var(--color-surface-container)]"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${
                    notification.type === "order"
                      ? "text-blue-600 dark:text-blue-400"
                      : notification.type === "promo"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-[var(--color-on-surface-variant)]"
                  }`}
                >
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
                    aria-label="Mark as read"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="text-[var(--color-outline-variant)] hover:text-red-500 p-2"
                  aria-label="Delete notification"
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

      {showSend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="notif-send-title">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
              <h2 id="notif-send-title" className="text-xl font-black text-[var(--color-on-surface)]">Send Notification</h2>
              <button
                onClick={() => setShowSend(false)}
                className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Template</label>
                <select
                  value={newNotification.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 text-[var(--color-on-surface)]"
                  aria-label="Select notification template"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Recipients</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as SegmentType)}
                  className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 text-[var(--color-on-surface)]"
                  aria-label="Select recipient segment"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Users (last 7 days)</option>
                  <option value="new">New Users (last 7 days)</option>
                  <option value="role">By Role</option>
                  <option value="service">By Service Type</option>
                </select>
              </div>

              {segment === "role" && (
                <div>
                  <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 text-[var(--color-on-surface)]"
                    aria-label="Select user role"
                  >
                    <option value="user">Users</option>
                    <option value="vendor">Vendors</option>
                    <option value="rider">Riders</option>
                  </select>
                </div>
              )}

              {segment === "service" && (
                <div>
                  <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Service Type</label>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 text-[var(--color-on-surface)]"
                    aria-label="Select service type"
                  >
                    <option value="food">Food</option>
                    <option value="grocery">Grocery</option>
                    <option value="print">Print</option>
                    <option value="dining">Dining</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 text-[var(--color-on-surface)]"
                  placeholder="Notification title"
                  aria-label="Notification title"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Message</label>
                <textarea
                  value={newNotification.body}
                  onChange={(e) => setNewNotification({ ...newNotification, body: e.target.value })}
                  className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 text-[var(--color-on-surface)]"
                  rows={3}
                  placeholder="Notification message"
                  aria-label="Notification message"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Type</label>
                <select
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as Notification["type"] })}
                  className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 text-[var(--color-on-surface)]"
                  aria-label="Notification type"
                >
                  <option value="system">System</option>
                  <option value="order">Order</option>
                  <option value="promo">Promotion</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="schedule-toggle"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-border-subtle)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                  aria-label="Schedule for later"
                />
                <label htmlFor="schedule-toggle" className="text-sm font-bold text-[var(--color-on-surface)] cursor-pointer">
                  Schedule for later
                </label>
              </div>

              {scheduleEnabled && (
                <div>
                  <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 text-[var(--color-on-surface)]"
                    aria-label="Scheduled date and time"
                  />
                </div>
              )}

              <div className="bg-[var(--color-surface-subtle)] rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">Preview</p>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    newNotification.type === "order"
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : newNotification.type === "promo"
                        ? "bg-amber-100 dark:bg-amber-900/30"
                        : "bg-[var(--color-surface-container)]"
                  }`}>
                    <span className={`material-symbols-outlined text-sm ${
                      newNotification.type === "order"
                        ? "text-blue-600 dark:text-blue-400"
                        : newNotification.type === "promo"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-[var(--color-on-surface-variant)]"
                    }`}>
                      {typeIcons[newNotification.type]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--color-on-surface)] text-sm">
                      {newNotification.title || "Notification Title"}
                    </p>
                    <p className="text-xs text-[var(--color-outline)] truncate">
                      {newNotification.body || "Notification message will appear here"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--color-outline-variant)] pt-1">
                  <span className="material-symbols-outlined text-xs">group</span>
                  <span>{getSegmentLabel()}</span>
                  {scheduleEnabled && scheduledAt && (
                    <>
                      <span className="material-symbols-outlined text-xs ml-2">schedule</span>
                      <span>{new Date(scheduledAt).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={sendNotification}
                className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:bg-[#a00018] transition-colors"
              >
                {scheduleEnabled ? "Schedule Notification" : `Send to ${getSegmentLabel()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
