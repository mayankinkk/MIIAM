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
    <div className="absolute inset-0 z-10 flex items-end justify-center pb-24 px-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white flex flex-col max-h-[80vh]">
        <div className="bg-gradient-to-r from-[#0b50d5] to-[#0044bf] p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <svg className="w-full h-full -rotate-90">
                <circle cx="24" cy="24" fill="transparent" r="22" stroke="rgba(255,255,255,0.3)" strokeWidth="3"></circle>
                <circle cx="24" cy="24" fill="transparent" r="22" stroke="white" strokeWidth="3" strokeDasharray={`${(300 - countdown) / 300 * 138} 138`}></circle>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-black text-sm">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div>
              <p className="text-[10px] opacity-80">{t.rider.order.newOrder} • {t.rider.order.fiveMin}</p>
              <h2 className="font-bold text-lg">{order.id?.substring(0, 8).toUpperCase() || t.rider.order.order}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] opacity-80">{t.rider.order.yourCut}</p>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black">₹{calculatePeakEarnings(order)}</span>
              {order.peakMultiplier > 1 && (
                <span className="bg-yellow-400 text-[#0b50d5] text-[10px] font-bold px-1.5 rounded">+{(order.peakMultiplier - 1) * 100}%</span>
              )}
            </div>
            <p className="text-[10px] opacity-60">{t.rider.order.orderTotal} ₹{order.orderTotal}</p>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex gap-2 mb-4 flex-wrap">
            {order.type === "multi_stop" ? (
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                {order.stops?.length} {t.rider.order.stops}
              </span>
            ) : (
              <span className="bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] px-2 py-1 rounded-full text-[10px] font-bold">
                {t.rider.order.foodDelivery}
              </span>
            )}
            <span className="bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] px-2 py-1 rounded-full text-[10px] font-bold">
              {order.items} {t.rider.order.items}
            </span>
            {order.priority === "high" && (
              <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">bolt</span>
                {t.rider.order.highPriority}
              </span>
            )}
            {isPeakHour() && (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-[10px] font-bold">
                {t.rider.order.peakHour}
              </span>
            )}
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {customerRating}
            </span>
          </div>

          {order.type === "multi_stop" && order.stops && (
            <div className="bg-purple-50 p-3 rounded-xl mb-4 border border-purple-100">
              <p className="text-[10px] text-purple-600 font-bold mb-2">{t.rider.order.multiStopBatch}</p>
              <div className="space-y-2">
                {order.stops.map((stop, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-[8px]">{i + 1}</span>
                      <span className="text-[var(--color-on-surface-variant)]">{stop.name}</span>
                    </div>
                    <span className="text-purple-600 font-bold">{stop.distance} km</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-purple-500 mt-2">{t.rider.order.completeAllToEarn} ₹{order.earnings}</p>
            </div>
          )}

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl mb-4 border border-green-100">
            <p className="text-[10px] text-green-600 font-bold mb-2">{t.rider.order.earningsBreakdown}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-outline)]">{t.rider.order.baseFare}</span>
                <span className="font-bold">₹40</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-outline)]">{t.rider.order.distance} ({order.totalDistance} km)</span>
                <span className="font-bold">₹{order.totalDistance * 8}</span>
              </div>
              {order.peakMultiplier > 1 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-outline)]">{t.rider.order.peakBonus}</span>
                    <span className="font-bold text-green-600">+₹{Math.round(40 + order.totalDistance * 8) * (order.peakMultiplier - 1)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-1">
                    <span className="font-bold">{t.rider.order.total}</span>
                    <span className="font-black text-green-600">₹{calculatePeakEarnings(order)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4 relative">
            <div className="absolute left-[10px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-[var(--color-outline-variant)]"></div>
            
            <div className="flex items-start gap-3">
              <div className="z-10 bg-[#0b50d5] w-5 h-5 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xs">restaurant</span>
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-[#0b50d5] font-bold">{t.rider.order.pickup}</p>
                <p className="font-bold text-sm">{order.vendor}</p>
                <p className="text-[10px] text-[var(--color-outline)]">{order.vendorAddress}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{order.distance} km</p>
                <p className="text-[9px] text-[var(--color-outline-variant)]">{order.time}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="z-10 bg-[var(--color-on-surface)] w-5 h-5 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xs">home</span>
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-[var(--color-on-surface)] font-bold">{t.rider.order.drop}</p>
                <p className="font-bold text-sm">{order.customer}</p>
                <p className="text-[10px] text-[var(--color-outline)]">{order.customerAddress}</p>
                <p className="text-[9px] text-[var(--color-outline-variant)] mt-1">📍 {order.landmark}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{order.distance2} km</p>
                <p className="text-[9px] text-[var(--color-outline-variant)]">{order.time2}</p>
              </div>
            </div>
          </div>

          {order.specialInstructions && (
            <div className="mt-4 bg-amber-50 p-3 rounded-xl border border-amber-100">
              <p className="text-[9px] text-amber-700 font-bold mb-1">{t.rider.order.specialInstructions}</p>
              <p className="text-xs text-amber-800">{order.specialInstructions}</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 bg-[var(--color-surface-subtle)] p-3 rounded-xl">
            <div>
              <p className="text-[9px] text-[var(--color-outline-variant)]">{t.rider.order.totalDistance}</p>
              <p className="font-bold">{order.totalDistance} km</p>
            </div>
            <div>
              <p className="text-[9px] text-[var(--color-outline-variant)]">{t.rider.order.estTime}</p>
              <p className="font-bold">{order.estCompletion} min</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-[var(--color-surface-subtle)] flex gap-3">
          <button 
            onClick={onDecline}
            aria-label={t.rider.order.decline}
            className="flex-1 py-3 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] font-bold rounded-xl text-sm"
          >
{t.rider.order.decline}
          </button>
          <button 
            onClick={() => onAccept(order)}
            aria-label={t.rider.order.acceptOrder}
            className="flex-[2] py-3 bg-[#0b50d5] text-white font-black rounded-xl text-sm shadow-lg"
          >
            {t.rider.order.acceptOrder}
          </button>
        </div>

        {isTakenByOther && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 text-center max-w-xs mx-4">
              <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
              <p className="font-bold text-lg mt-3">{t.rider.order.orderTaken}</p>
              <p className="text-sm text-[var(--color-outline)] mt-1">{t.rider.order.orderTakenDesc}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
