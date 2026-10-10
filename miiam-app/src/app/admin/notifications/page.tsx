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
  {
    label: "Welcome Message",
    value: "welcome",
    title: "Welcome to MIIAM!",
    body: "Thank you for joining MIIAM! Explore our wide range of food, grocery, and print services. Start ordering now and enjoy exclusive offers.",
  },
  {
    label: "Order Update",
    value: "order_update",
    title: "Order Update",
    body: "Your order has been updated. Check the app for the latest status and delivery details.",
  },
  {
    label: "Promotional Offer",
    value: "promo",
    title: "Special Offer Just for You!",
    body: "Get 20% off on your next order! Use code MIIAM20 at checkout. Valid for the next 48 hours only.",
  },
  {
    label: "System Maintenance",
    value: "maintenance",
    title: "Scheduled Maintenance",
    body: "We'll be performing scheduled maintenance on our systems. Some services may be temporarily unavailable. We apologize for the inconvenience.",
  },
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
      addToast(
        `Notification scheduled for ${new Date(scheduledAt).toLocaleString()} for ${userIds.length} users`,
        "success"
      );
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
  const typeIcons: Record<string, string> = {
    order: "shopping_cart",
    promo: "local_offer",
    system: "settings",
  };

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
    <div className="space-y-8 px-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Notification Center
          </h1>
          <p className="text-[var(--color-outline)]">Send and manage push notifications.</p>
        </div>
        <button
          onClick={() => setShowSend(true)}
          className="text-on-primary rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold shadow-lg shadow-red-900/10 transition-all hover:scale-105 active:scale-95"
        >
          + Send Notification
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Total
          </p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">
            {notifications.length}
          </p>
        </div>
        <div className="rounded-3xl border border-yellow-100 bg-yellow-50 p-6 shadow-sm dark:border-yellow-800/30 dark:bg-yellow-900/20">
          <p className="mb-1 text-xs font-black tracking-widest text-yellow-600 uppercase dark:text-yellow-400">
            Unread
          </p>
          <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400">{unreadCount}</p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Order Alerts
          </p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">
            {notifications.filter((n) => n.type === "order").length}
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Promotions
          </p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">
            {notifications.filter((n) => n.type === "promo").length}
          </p>
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

      <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="max-h-[500px] divide-y divide-slate-50 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 p-4 transition-colors hover:bg-[var(--color-surface-subtle)] ${!notification.is_read ? "bg-accent/10 dark:bg-accent/20" : ""}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  notification.type === "order"
                    ? "bg-accent/10 dark:bg-accent/20"
                    : notification.type === "promo"
                      ? "bg-amber-100 dark:bg-amber-900/30"
                      : "bg-[var(--color-surface-container)]"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${
                    notification.type === "order"
                      ? "text-accent"
                      : notification.type === "promo"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-[var(--color-on-surface-variant)]"
                  }`}
                >
                  {typeIcons[notification.type]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[var(--color-on-surface)]">{notification.title}</p>
                  {!notification.is_read && (
                    <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]"></span>
                  )}
                </div>
                <p className="truncate text-sm text-[var(--color-outline)]">{notification.body}</p>
                <p className="mt-1 text-xs text-[var(--color-outline-variant)]">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-2 text-[var(--color-outline-variant)] hover:text-[var(--color-primary)]"
                    aria-label="Mark as read"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="p-2 text-[var(--color-outline-variant)] hover:text-red-500"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-send-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[var(--color-surface-container-lowest)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] p-6">
              <h2
                id="notif-send-title"
                className="text-xl font-black text-[var(--color-on-surface)]"
              >
                Send Notification
              </h2>
              <button
                onClick={() => setShowSend(false)}
                className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Template
                </label>
                <select
                  value={newNotification.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                  aria-label="Select notification template"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Recipients
                </label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as SegmentType)}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
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
                  <label className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                    Role
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
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
                  <label className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                    Service Type
                  </label>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
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
                <label className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Title
                </label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) =>
                    setNewNotification({ ...newNotification, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                  placeholder="Notification title"
                  aria-label="Notification title"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Message
                </label>
                <textarea
                  value={newNotification.body}
                  onChange={(e) => setNewNotification({ ...newNotification, body: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                  rows={3}
                  placeholder="Notification message"
                  aria-label="Notification message"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Type
                </label>
                <select
                  value={newNotification.type}
                  onChange={(e) =>
                    setNewNotification({
                      ...newNotification,
                      type: e.target.value as Notification["type"],
                    })
                  }
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
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
                  className="h-4 w-4 rounded border-[var(--color-border-subtle)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                  aria-label="Schedule for later"
                />
                <label
                  htmlFor="schedule-toggle"
                  className="cursor-pointer text-sm font-bold text-[var(--color-on-surface)]"
                >
                  Schedule for later
                </label>
              </div>

              {scheduleEnabled && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                    aria-label="Scheduled date and time"
                  />
                </div>
              )}

              <div className="space-y-2 rounded-xl bg-[var(--color-surface-subtle)] p-4">
                <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Preview
                </p>
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      newNotification.type === "order"
                        ? "bg-accent/10 dark:bg-accent/20"
                        : newNotification.type === "promo"
                          ? "bg-amber-100 dark:bg-amber-900/30"
                          : "bg-[var(--color-surface-container)]"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-sm ${
                        newNotification.type === "order"
                          ? "text-accent"
                          : newNotification.type === "promo"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-[var(--color-on-surface-variant)]"
                      }`}
                    >
                      {typeIcons[newNotification.type]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--color-on-surface)]">
                      {newNotification.title || "Notification Title"}
                    </p>
                    <p className="truncate text-xs text-[var(--color-outline)]">
                      {newNotification.body || "Notification message will appear here"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[10px] text-[var(--color-outline-variant)]">
                  <span className="material-symbols-outlined text-xs">group</span>
                  <span>{getSegmentLabel()}</span>
                  {scheduleEnabled && scheduledAt && (
                    <>
                      <span className="material-symbols-outlined ml-2 text-xs">schedule</span>
                      <span>{new Date(scheduledAt).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={sendNotification}
                className="bg-primary text-on-primary hover:bg-primary-dim w-full rounded-xl py-3 font-bold transition-colors"
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
