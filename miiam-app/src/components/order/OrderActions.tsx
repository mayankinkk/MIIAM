"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderActionsProps {
  order: {
    id: string;
    status: string;
    placed_at?: string;
    total_amount: number;
    payment_method?: string;
    delivery_address?: string | null;
    delivery_instructions?: string;
    vendor?: { shopName?: string; name?: string; image_url?: string; logo_url?: string; address?: string; phone?: string } | null;
    items?: Array<{ name: string; quantity: number | string; unitPrice?: number | string; price?: number | string }>;
    riders?: { phone?: string } | null;
  };
  canCancel: boolean;
  showHelp: boolean;
  onToggleHelp: () => void;
  onShowCancelReason: () => void;
}

export default function OrderActions({ order, canCancel, showHelp, onToggleHelp, onShowCancelReason }: OrderActionsProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <button
        onClick={onToggleHelp}
        className="w-full bg-gradient-to-r from-primary to-primary-container text-white rounded-xl py-4 sm:py-5 text-base sm:text-lg font-extrabold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
      >
        {canCancel ? t.orders.cancelOrder : t.orders.helpWithOrder}
      </button>

      {/* Show cancelled state prominently */}
      {order.status === "cancelled" && (
        <div className="w-full bg-status-error/10 dark:bg-status-error/20 border border-status-error/20 dark:border-status-error/40 rounded-xl py-4 text-center">
          <span className="material-symbols-outlined text-status-error text-3xl block mb-1">cancel</span>
          <p className="text-status-error font-bold">{t.orders.orderCancelled}</p>
          <p className="text-sm text-status-error/70 mt-1">{t.orders.orderCancelledDesc}</p>
        </div>
      )}

      {order.status === "no_rider_available" && (
        <div className="w-full bg-status-warning/10 dark:bg-status-warning/20 border border-status-warning/20 dark:border-status-warning/40 rounded-xl py-4 text-center">
          <span className="material-symbols-outlined text-status-warning text-3xl block mb-1">local_shipping</span>
          <p className="text-status-warning font-bold">{t.orders.noRiders}</p>
          <p className="text-sm text-status-warning/70 mt-1">{t.orders.noRidersDesc}</p>
          <Link
            href="/app/home"
            className="inline-block mt-3 px-6 py-2 bg-status-warning text-white font-bold rounded-xl text-sm"
          >
            {t.orders.browseRestaurants}
          </Link>
        </div>
      )}

      {!canCancel && order && order.status !== "delivered" && order.status !== "cancelled" && order.status !== "no_rider_available" && (
        <p className="text-center text-sm text-on-surface-variant mt-2">
          {t.orders.contactForChanges}
        </p>
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-on-surface">{t.orders.needHelp}</h2>
              <button onClick={onToggleHelp} className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center" aria-label="Close help dialog">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/app/orders/${order.id}/chat`)}
                className="w-full p-4 bg-status-info/10 dark:bg-status-info/20 text-status-info rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">chat</span>
                {t.orders.chatWithRider}
              </button>

              {order?.riders?.phone ? (
                <a
                  href={`tel:${order.riders.phone}`}
                  className="w-full p-4 bg-status-success/10 dark:bg-status-success/20 text-status-success rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">call</span>
                  {t.orders.callRider}
                </a>
              ) : (
                <a
                  href="tel:+919957873472"
                  className="w-full p-4 bg-status-success/10 dark:bg-status-success/20 text-status-success rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">call</span>
                  {t.orders.callSupport}
                </a>
              )}

              {canCancel && (
                <button
                  onClick={onShowCancelReason}
                  className="w-full p-4 bg-status-error/10 dark:bg-status-error/20 text-status-error rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">cancel</span>
                  {t.orders.cancelOrder}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
