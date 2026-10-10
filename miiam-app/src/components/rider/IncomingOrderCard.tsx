"use client";

import type { OrderWithTiming } from "@/app/rider/dashboard/types";
import { calculatePeakEarnings, isPeakHour } from "@/app/rider/dashboard/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface IncomingOrderCardProps {
  order: OrderWithTiming;
  countdown: number;
  customerRating: number;
  onAccept: (order: OrderWithTiming) => void;
  onDecline: () => void;
  isTakenByOther: boolean;
}

export default function IncomingOrderCard({
  order,
  countdown,
  customerRating,
  onAccept,
  onDecline,
  isTakenByOther,
}: IncomingOrderCardProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center px-4 pb-24">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white bg-white/95 shadow-2xl backdrop-blur-xl dark:border-gray-700 dark:bg-[var(--color-surface)]/95">
        <div className="from-brand-secondary to-secondary-dim flex items-center justify-between bg-gradient-to-r p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  fill="transparent"
                  r="22"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3"
                ></circle>
                <circle
                  cx="24"
                  cy="24"
                  fill="transparent"
                  r="22"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray={`${((300 - countdown) / 300) * 138} 138`}
                ></circle>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-black">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <div>
              <p className="text-[10px] opacity-80">
                {t.rider.order.newOrder} • {t.rider.order.fiveMin}
              </p>
              <h2 className="text-lg font-bold">
                {order.id?.substring(0, 8).toUpperCase() || t.rider.order.order}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] opacity-80">{t.rider.order.yourCut}</p>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black">₹{calculatePeakEarnings(order)}</span>
              {order.peakMultiplier > 1 && (
                <span className="text-brand-secondary rounded bg-yellow-400 px-1.5 text-[10px] font-bold">
                  +{(order.peakMultiplier - 1) * 100}%
                </span>
              )}
            </div>
            <p className="text-[10px] opacity-60">
              {t.rider.order.orderTotal} ₹{order.orderTotal}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {order.type === "multi_stop" ? (
              <span className="bg-accent/10 text-accent flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold">
                <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                {order.stops?.length} {t.rider.order.stops}
              </span>
            ) : (
              <span className="rounded-full bg-[var(--color-surface-container)] px-2 py-1 text-[10px] font-bold text-[var(--color-on-surface-variant)]">
                {t.rider.order.foodDelivery}
              </span>
            )}
            <span className="rounded-full bg-[var(--color-surface-container)] px-2 py-1 text-[10px] font-bold text-[var(--color-on-surface-variant)]">
              {order.items} {t.rider.order.items}
            </span>
            {order.priority === "high" && (
              <span className="bg-status-error/10 text-status-error flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold">
                <span className="material-symbols-outlined text-[12px]">bolt</span>
                {t.rider.order.highPriority}
              </span>
            )}
            {isPeakHour() && (
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold text-yellow-700">
                {t.rider.order.peakHour}
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
              <span
                className="material-symbols-outlined text-[12px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {customerRating}
            </span>
          </div>

          {order.type === "multi_stop" && order.stops && (
            <div className="bg-accent/10 border-accent/40 mb-4 rounded-xl border p-3">
              <p className="text-accent mb-2 text-[10px] font-bold">
                {t.rider.order.multiStopBatch}
              </p>
              <div className="space-y-2">
                {order.stops.map((stop, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-accent/20 text-accent flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold">
                        {i + 1}
                      </span>
                      <span className="text-[var(--color-on-surface-variant)]">{stop.name}</span>
                    </div>
                    <span className="text-accent font-bold">{stop.distance} km</span>
                  </div>
                ))}
              </div>
              <p className="text-accent mt-2 text-[9px]">
                {t.rider.order.completeAllToEarn} ₹{order.earnings}
              </p>
            </div>
          )}

          <div className="mb-4 rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-3">
            <p className="mb-2 text-[10px] font-bold text-green-600">
              {t.rider.order.earningsBreakdown}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-outline)]">{t.rider.order.baseFare}</span>
                <span className="font-bold">₹40</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-outline)]">
                  {t.rider.order.distance} ({order.totalDistance} km)
                </span>
                <span className="font-bold">₹{order.totalDistance * 8}</span>
              </div>
              {order.peakMultiplier > 1 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-outline)]">{t.rider.order.peakBonus}</span>
                    <span className="font-bold text-green-600">
                      +₹{Math.round(40 + order.totalDistance * 8) * (order.peakMultiplier - 1)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between border-t pt-1">
                    <span className="font-bold">{t.rider.order.total}</span>
                    <span className="font-black text-green-600">
                      ₹{calculatePeakEarnings(order)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative space-y-4">
            <div className="absolute top-4 bottom-4 left-[10px] w-0.5 border-l-2 border-dashed border-[var(--color-outline-variant)]"></div>

            <div className="flex items-start gap-3">
              <div className="bg-brand-secondary z-10 flex h-5 w-5 items-center justify-center rounded-full">
                <span className="material-symbols-outlined text-xs text-white">restaurant</span>
              </div>
              <div className="flex-1">
                <p className="text-brand-secondary text-[9px] font-bold">{t.rider.order.pickup}</p>
                <p className="text-sm font-bold">{order.vendor}</p>
                <p className="text-[10px] text-[var(--color-outline)]">{order.vendorAddress}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{order.distance} km</p>
                <p className="text-[9px] text-[var(--color-outline-variant)]">{order.time}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-on-surface)]">
                <span className="material-symbols-outlined text-xs text-white">home</span>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-bold text-[var(--color-on-surface)]">
                  {t.rider.order.drop}
                </p>
                <p className="text-sm font-bold">{order.customer}</p>
                <p className="text-[10px] text-[var(--color-outline)]">{order.customerAddress}</p>
                <p className="mt-1 text-[9px] text-[var(--color-outline-variant)]">
                  📍 {order.landmark}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{order.distance2} km</p>
                <p className="text-[9px] text-[var(--color-outline-variant)]">{order.time2}</p>
              </div>
            </div>
          </div>

          {order.specialInstructions && (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="mb-1 text-[9px] font-bold text-amber-700">
                {t.rider.order.specialInstructions}
              </p>
              <p className="text-xs text-amber-800">{order.specialInstructions}</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[var(--color-surface-subtle)] p-3">
            <div>
              <p className="text-[9px] text-[var(--color-outline-variant)]">
                {t.rider.order.totalDistance}
              </p>
              <p className="font-bold">{order.totalDistance} km</p>
            </div>
            <div>
              <p className="text-[9px] text-[var(--color-outline-variant)]">
                {t.rider.order.estTime}
              </p>
              <p className="font-bold">{order.estCompletion} min</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t bg-[var(--color-surface-subtle)] p-4">
          <button
            onClick={onDecline}
            aria-label={t.rider.order.decline}
            className="flex-1 rounded-xl bg-[var(--color-surface-container-high)] py-3 text-sm font-bold text-[var(--color-on-surface-variant)]"
          >
            {t.rider.order.decline}
          </button>
          <button
            onClick={() => onAccept(order)}
            aria-label={t.rider.order.acceptOrder}
            className="bg-brand-secondary flex-[2] rounded-xl py-3 text-sm font-black text-white shadow-lg"
          >
            {t.rider.order.acceptOrder}
          </button>
        </div>

        {isTakenByOther && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 max-w-xs rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 text-center">
              <span className="material-symbols-outlined text-5xl text-red-500">error</span>
              <p className="mt-3 text-lg font-bold">{t.rider.order.orderTaken}</p>
              <p className="mt-1 text-sm text-[var(--color-outline)]">
                {t.rider.order.orderTakenDesc}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
