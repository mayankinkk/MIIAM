"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

interface OrderActionsProps {
  order: {
    id: string;
    status: string;
    placed_at?: string;
    total_amount: number;
    payment_method?: string;
    delivery_address?: string | null;
    delivery_instructions?: string;
    vendor?: {
      shopName?: string;
      name?: string;
      image_url?: string;
      logo_url?: string;
      address?: string;
      phone?: string;
    } | null;
    items?: Array<{
      name: string;
      quantity: number | string;
      unitPrice?: number | string;
      price?: number | string;
    }>;
    riders?: { phone?: string } | null;
  };
  canCancel: boolean;
  showHelp: boolean;
  onToggleHelp: () => void;
  onShowCancelReason: () => void;
}

export default function OrderActions({
  order,
  canCancel,
  showHelp,
  onToggleHelp,
  onShowCancelReason,
}: OrderActionsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const downloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/invoice`);
      if (!res.ok) throw new Error("Invoice request failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("Invoice downloaded", "success");
    } catch (err) {
      logger.error({ err }, "Invoice download failed");
      addToast("Could not download invoice. Please try again.", "error");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <>
      <button
        onClick={onToggleHelp}
        className="from-primary to-primary-container text-on-primary shadow-primary/20 w-full rounded-xl bg-gradient-to-r py-4 text-base font-extrabold shadow-lg transition-all hover:scale-[1.02] active:scale-95 sm:py-5 sm:text-lg"
      >
        {canCancel ? t.orders.cancelOrder : t.orders.helpWithOrder}
      </button>

      {/* Show cancelled state prominently */}
      {order.status === "cancelled" && (
        <div className="bg-status-error/10 dark:bg-status-error/20 border-status-error/20 dark:border-status-error/40 w-full rounded-xl border py-4 text-center">
          <span className="material-symbols-outlined text-status-error mb-1 block text-3xl">
            cancel
          </span>
          <p className="text-status-error font-bold">{t.orders.orderCancelled}</p>
          <p className="text-status-error/70 mt-1 text-sm">{t.orders.orderCancelledDesc}</p>
        </div>
      )}

      {order.status === "no_rider_available" && (
        <div className="bg-status-warning/10 dark:bg-status-warning/20 border-status-warning/20 dark:border-status-warning/40 w-full rounded-xl border py-4 text-center">
          <span className="material-symbols-outlined text-status-warning mb-1 block text-3xl">
            local_shipping
          </span>
          <p className="text-status-warning font-bold">{t.orders.noRiders}</p>
          <p className="text-status-warning/70 mt-1 text-sm">{t.orders.noRidersDesc}</p>
          <Link
            href="/app/home"
            className="bg-status-warning mt-3 inline-block rounded-xl px-6 py-2 text-sm font-bold text-white"
          >
            {t.orders.browseRestaurants}
          </Link>
        </div>
      )}

      {!canCancel &&
        order &&
        order.status !== "delivered" &&
        order.status !== "cancelled" &&
        order.status !== "no_rider_available" && (
          <p className="text-on-surface-variant mt-2 text-center text-sm">
            {t.orders.contactForChanges}
          </p>
        )}

      {showHelp && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-on-surface text-xl font-black">{t.orders.needHelp}</h2>
              <button
                onClick={onToggleHelp}
                className="bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-full"
                aria-label="Close help dialog"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/app/orders/${order.id}/chat`)}
                className="bg-status-info/10 dark:bg-status-info/20 text-status-info flex w-full items-center justify-center gap-2 rounded-xl p-4 font-bold"
              >
                <span className="material-symbols-outlined">chat</span>
                {t.orders.chatWithRider}
              </button>

              {order?.riders?.phone ? (
                <a
                  href={`tel:${order.riders.phone}`}
                  className="bg-status-success/10 dark:bg-status-success/20 text-status-success flex w-full items-center justify-center gap-2 rounded-xl p-4 font-bold"
                >
                  <span className="material-symbols-outlined">call</span>
                  {t.orders.callRider}
                </a>
              ) : (
                <a
                  href="tel:+919957873472"
                  className="bg-status-success/10 dark:bg-status-success/20 text-status-success flex w-full items-center justify-center gap-2 rounded-xl p-4 font-bold"
                >
                  <span className="material-symbols-outlined">call</span>
                  {t.orders.callSupport}
                </a>
              )}

              {canCancel && (
                <button
                  onClick={onShowCancelReason}
                  className="bg-status-error/10 dark:bg-status-error/20 text-status-error flex w-full items-center justify-center gap-2 rounded-xl p-4 font-bold"
                >
                  <span className="material-symbols-outlined">cancel</span>
                  {t.orders.cancelOrder}
                </button>
              )}

              {order.status === "delivered" && (
                <button
                  onClick={downloadInvoice}
                  disabled={downloadingInvoice}
                  className="bg-surface-container-high text-on-surface flex w-full items-center justify-center gap-2 rounded-xl p-4 font-bold disabled:opacity-60"
                >
                  <span className="material-symbols-outlined">download</span>
                  {downloadingInvoice ? "Preparing…" : "Download Invoice"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
