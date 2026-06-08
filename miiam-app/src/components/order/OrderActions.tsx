"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/print/PrintButton";

interface OrderActionsProps {
  order: any;
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

      <PrintButton
        variant="full"
        order={{
          id: order.id,
          placedAt: order.placed_at,
          totalAmount: order.total_amount,
          paymentMethod: order.payment_method,
          deliveryAddress: order.delivery_address,
          deliveryInstructions: order.delivery_instructions,
          status: order.status,
          vendor: order.vendor,
          items: order.items,
        }}
      />

      {/* Show cancelled state prominently */}
      {order.status === "cancelled" && (
        <div className="w-full bg-red-50 border border-red-200 rounded-xl py-4 text-center">
          <span className="material-symbols-outlined text-red-500 text-3xl block mb-1">cancel</span>
          <p className="text-red-600 font-bold">{t.orders.orderCancelled}</p>
          <p className="text-sm text-red-400 mt-1">{t.orders.orderCancelledDesc}</p>
        </div>
      )}

      {order.status === "no_rider_available" && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-xl py-4 text-center">
          <span className="material-symbols-outlined text-amber-500 text-3xl block mb-1">local_shipping</span>
          <p className="text-amber-700 font-bold">No Riders Available</p>
          <p className="text-sm text-amber-500 mt-1">No rider could accept your order in time. Please try placing the order again or contact support.</p>
          <Link
            href="/app/home"
            className="inline-block mt-3 px-6 py-2 bg-amber-500 text-white font-bold rounded-xl text-sm"
          >
            Browse Restaurants
          </Link>
        </div>
      )}

      {!canCancel && order && order.status !== "delivered" && order.status !== "cancelled" && order.status !== "no_rider_available" && (
        <p className="text-center text-sm text-on-surface-variant mt-2">
          Contact rider or customer support to make changes
        </p>
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-on-surface">{t.orders.needHelp}</h2>
              <button onClick={onToggleHelp} className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/app/orders/${order.id}/chat`)}
                className="w-full p-4 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">chat</span>
                {t.orders.chatWithRider}
              </button>

              {order?.riders?.phone ? (
                <a
                  href={`tel:${order.riders.phone}`}
                  className="w-full p-4 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">call</span>
                  {t.orders.callRider}
                </a>
              ) : (
                <a
                  href="tel:+919876543210"
                  className="w-full p-4 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">call</span>
                  {t.orders.callSupport}
                </a>
              )}

              {canCancel && (
                <button
                  onClick={onShowCancelReason}
                  className="w-full p-4 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2"
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
