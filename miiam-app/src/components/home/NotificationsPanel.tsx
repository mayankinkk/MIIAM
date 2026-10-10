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

export default function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
  notifTab,
  onTabChange,
}: NotificationsPanelProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="bg-surface-container-lowest border-outline-variant/10 animate-in slide-in-from-right absolute top-0 right-0 h-full w-full max-w-md border-l shadow-2xl duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-outline-variant/10 flex items-center justify-between border-b p-4">
          <h2 id="notifications-title" className="text-on-surface text-xl font-black">
            {t.home.notifications}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="bg-surface-container-high flex h-11 w-11 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {/* Tabs */}
        <div
          className="border-outline-variant/10 flex border-b"
          role="tablist"
          aria-label="Notification categories"
        >
          {(["all", "orders", "offers"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={notifTab === tab}
              onClick={() => onTabChange(tab)}
              className={`flex-1 border-b-2 py-3 text-sm font-bold ${notifTab === tab ? "text-accent border-primary" : "border-transparent text-gray-400"}`}
            >
              {tab === "all" ? t.home.all : tab === "orders" ? t.home.ordersTab : t.home.offersTab}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="h-[calc(100vh-140px)] overflow-y-auto">
          {notifications
            .filter(
              (n) =>
                notifTab === "all" ||
                (notifTab === "orders" && (n.type === "order" || n.type === "info")) ||
                (notifTab === "offers" && (n.type === "promo" || n.type === "offer"))
            )
            .map((notif) => (
              <div
                key={notif.id}
                className={`border-outline-variant/10 border-b p-4 transition-colors ${!notif.is_read ? "bg-primary/10" : "hover:bg-surface-container-high/50"}`}
              >
                <div className="flex gap-3">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                      notif.type === "order"
                        ? "bg-surface-container-high"
                        : notif.type === "promo"
                          ? "bg-amber-500/10"
                          : "bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-accent">
                      {notif.type === "order"
                        ? "restaurant"
                        : notif.type === "promo"
                          ? "local_offer"
                          : "info"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p
                        className={`text-on-surface text-sm font-bold ${!notif.is_read ? "text-accent" : ""}`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-on-surface-variant mt-1 text-xs">
                      {notif.body || notif.message}
                    </p>
                    {notif.type === "offer" && (
                      <button
                        onClick={() => {
                          if (notif.body) {
                            navigator.clipboard.writeText(notif.body);
                            import("@/lib/store/toastStore").then((m) =>
                              m.useToastStore.getState().addToast("Coupon code copied!", "success")
                            );
                          }
                        }}
                        className="text-accent mt-2 text-xs font-bold"
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
              <span className="material-symbols-outlined text-4xl text-gray-300">
                notifications_off
              </span>
              <p className="mt-2 text-gray-500">{t.home.noNotifications}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
