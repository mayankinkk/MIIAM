"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface Notification {
  id: string;
  title: string;
  body?: string;
  message?: string;
  type: "order" | "promo" | "offer" | "info" | "system" | "rider";
  is_read: boolean;
  created_at: string;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  notifTab: "all" | "orders" | "offers";
  onTabChange: (tab: "all" | "orders" | "offers") => void;
}

export default function NotificationsPanel({ isOpen, onClose, notifications, notifTab, onTabChange }: NotificationsPanelProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="notifications-title" onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-surface-container-lowest border-l border-outline-variant/10 shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
          <h2 id="notifications-title" className="text-xl font-black text-on-surface">{t.home.notifications}</h2>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="w-11 h-11 bg-surface-container-high rounded-full flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/10" role="tablist" aria-label="Notification categories">
          {(["all", "orders", "offers"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={notifTab === tab}
              onClick={() => onTabChange(tab)}
              className={`flex-1 py-3 text-sm font-bold border-b-2 ${notifTab === tab ? "text-primary border-primary" : "text-gray-400 border-transparent"}`}
            >
              {tab === "all" ? t.home.all : tab === "orders" ? t.home.ordersTab : t.home.offersTab}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto h-[calc(100vh-140px)]">
          {notifications
            .filter(n => notifTab === "all" || (notifTab === "orders" && (n.type === "order" || n.type === "info")) || (notifTab === "offers" && (n.type === "promo" || n.type === "offer")))
            .map((notif) => (
            <div key={notif.id} className={`p-4 border-b border-outline-variant/10 transition-colors ${!notif.is_read ? 'bg-primary/10' : 'hover:bg-surface-container-high/50'}`}>
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notif.type === "order" ? "bg-surface-container-high" :
                  notif.type === "promo" ? "bg-amber-500/10" : "bg-surface-container-low"
                }`}>
                  <span className="material-symbols-outlined text-primary">
                    {notif.type === "order" ? "restaurant" :
                     notif.type === "promo" ? "local_offer" : "info"}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <p className={`font-bold text-on-surface text-sm ${!notif.is_read ? 'text-primary' : ''}`}>{notif.title}</p>
                    <span className="text-[10px] text-gray-400">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{notif.body || notif.message}</p>
                  {notif.type === "offer" && (
                    <button
                      onClick={() => {
                        if (notif.body) {
                          navigator.clipboard.writeText(notif.body);
                          import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Coupon code copied!", "success"));
                        }
                      }}
                      className="mt-2 text-xs font-bold text-primary"
                      aria-label={`Apply offer: ${notif.title}`}
                    >
                      {t.home.applyNow}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {notifications.length === 0 && (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300">notifications_off</span>
              <p className="text-gray-500 mt-2">{t.home.noNotifications}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
