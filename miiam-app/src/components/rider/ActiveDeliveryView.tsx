"use client";

import Link from "next/link";
import type { OrderWithTiming } from "@/app/rider/dashboard/types";
import { calculatePeakEarnings } from "@/app/rider/dashboard/utils";
import CustomerLocationView from "@/components/rider/CustomerLocationView";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ActiveDeliveryViewProps {
  currentOrder: OrderWithTiming;
  activeOrders: OrderWithTiming[];
  deliveryStep: string;
  currentStopIndex: number;
  unreadCount: number;
  pickedItems: Set<number>;
  onSetCurrentOrder: (order: OrderWithTiming) => void;
  onSetDeliveryStep: (step: string) => void;
  onCallCustomer: () => void;
  onStartChat: () => void;
  onPickedUp: () => void;
  onArrived: () => void;
  onComplete: () => void;
  onItemsCollected: () => void;
  onSetPickedItems: (fn: (prev: Set<number>) => Set<number>) => void;
}

export default function ActiveDeliveryView({
  currentOrder,
  activeOrders,
  deliveryStep,
  currentStopIndex,
  unreadCount,
  pickedItems,
  onSetCurrentOrder,
  onSetDeliveryStep,
  onCallCustomer,
  onStartChat,
  onPickedUp,
  onArrived,
  onComplete,
  onItemsCollected,
  onSetPickedItems,
}: ActiveDeliveryViewProps) {
  const { t } = useTranslation();
  const headerBg = deliveryStep === "shopping" ? "bg-purple-600" : deliveryStep === "picking_up" ? "bg-[#0b50d5]" : deliveryStep === "delivering" ? "bg-[var(--color-on-surface)]" : "bg-green-600";

  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center pb-24 px-4">
      <div className="max-w-md w-full bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden shadow-2xl">
        {activeOrders.length > 1 && (
          <div className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-border-subtle)] px-3 py-2 flex items-center gap-1 overflow-x-auto">
            <span className="material-symbols-outlined text-[var(--color-outline-variant)] text-sm">stack</span>
            {activeOrders.map((ao) => (
              <button
                key={ao.id}
                onClick={() => { onSetCurrentOrder(ao); onSetDeliveryStep("shopping"); }}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  currentOrder?.id === ao.id
                    ? "bg-[#0b50d5] text-white"
                    : "bg-[var(--color-surface-container-lowest)] text-[var(--color-outline)] border border-[var(--color-border-subtle)]"
                }`}
              >
                #{ao.id.slice(-4).toUpperCase()}
              </button>
            ))}
          </div>
        )}

        <div className={`p-4 text-white ${headerBg}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                {deliveryStep === "picking_up" ? "restaurant" : deliveryStep === "delivering" ? "local_shipping" : "location_on"}
              </span>
              <span className="font-bold text-sm uppercase">
                {currentOrder.type === "multi_stop" 
                  ? deliveryStep === "picking_up" ? t.rider.delivery.pickupStep : deliveryStep === "delivering" ? `${t.rider.delivery.stop} ${currentStopIndex + 1}/${currentOrder.stops?.length}` : t.rider.delivery.completeStep
                  : deliveryStep === "shopping" ? t.rider.delivery.shopItemsLabel : deliveryStep === "picking_up" ? t.rider.delivery.pickupStep : deliveryStep === "delivering" ? t.rider.delivery.deliveringLabel : t.rider.delivery.arrivedLabel
                }
              </span>
              {currentOrder.type === "multi_stop" && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">{t.rider.delivery.batch}</span>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">₹{calculatePeakEarnings(currentOrder)}</p>
            </div>
          </div>

          {currentOrder.type === "multi_stop" && currentOrder.stops && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-[9px] mb-1">
                <span className="opacity-70">{t.rider.delivery.progress}</span>
                <span>{currentStopIndex + 1}/{currentOrder.stops.length} {t.rider.delivery.stops}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${((currentStopIndex + 1) / currentOrder.stops.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {(deliveryStep === "delivering" || deliveryStep === "arrived") && currentOrder.orderDbId && (
            <div className="bg-[var(--color-surface-container-lowest)]">
              <CustomerLocationView orderId={currentOrder.orderDbId} className="rounded-none border-0" height={170} />
            </div>
          )}

          <div className="flex items-center justify-between text-[10px]">
            {currentOrder.type === "multi_stop" ? (
              <>
                <div className={`flex flex-col items-center ${deliveryStep === "picking_up" ? "text-white" : "text-white/50"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${deliveryStep === "picking_up" ? "bg-[var(--color-surface-container-lowest)] text-[#0b50d5]" : "bg-white/30"}`}>1</div>
                  <span>{t.rider.delivery.pickupStep}</span>
                </div>
                <div className="flex-1 h-0.5 bg-white/30 mx-2"><div className={`h-full bg-white ${deliveryStep !== "picking_up" ? "w-full" : "w-0"}`}></div></div>
                <div className={`flex flex-col items-center ${deliveryStep === "delivering" || deliveryStep === "arrived" ? "text-white" : "text-white/50"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${deliveryStep === "delivering" || deliveryStep === "arrived" ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]" : "bg-white/30"}`}>2</div>
                  <span>{t.rider.delivery.deliveriesStep}</span>
                </div>
                <div className="flex-1 h-0.5 bg-white/30 mx-2"><div className={`h-full bg-white ${deliveryStep === "arrived" ? "w-full" : "w-0"}`}></div></div>
                <div className={`flex flex-col items-center ${deliveryStep === "arrived" ? "text-white" : "text-white/50"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${deliveryStep === "arrived" ? "bg-[var(--color-surface-container-lowest)] text-green-600" : "bg-white/30"}`}>3</div>
                  <span>{t.rider.delivery.completeStep}</span>
                </div>
              </>
            ) : (
              <>
                <div className={`flex flex-col items-center ${deliveryStep === "shopping" ? "text-white" : "text-white/50"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${deliveryStep === "shopping" ? "bg-[var(--color-surface-container-lowest)] text-purple-600" : "bg-white/30"}`}>1</div>
                  <span>{t.rider.delivery.shopStep}</span>
                </div>
                <div className="flex-1 h-0.5 bg-white/30 mx-2"><div className={`h-full bg-white ${["picking_up", "delivering", "arrived"].includes(deliveryStep) ? "w-full" : "w-0"}`}></div></div>
                <div className={`flex flex-col items-center ${["picking_up", "delivering", "arrived"].includes(deliveryStep) ? "text-white" : "text-white/50"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${["picking_up", "delivering", "arrived"].includes(deliveryStep) ? "bg-[var(--color-surface-container-lowest)] text-[#0b50d5]" : "bg-white/30"}`}>2</div>
                  <span>{t.rider.delivery.deliverStep}</span>
                </div>
                <div className="flex-1 h-0.5 bg-white/30 mx-2"><div className={`h-full bg-white ${deliveryStep === "arrived" ? "w-full" : "w-0"}`}></div></div>
                <div className={`flex flex-col items-center ${deliveryStep === "arrived" ? "text-white" : "text-white/50"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${deliveryStep === "arrived" ? "bg-[var(--color-surface-container-lowest)] text-green-600" : "bg-white/30"}`}>3</div>
                  <span>{t.rider.delivery.collectStep}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-4">
          {deliveryStep === "shopping" && currentOrder.type !== "multi_stop" && (
            <>
              <div className="mb-4">
                <p className="text-[10px] text-purple-600 font-bold mb-2">{t.rider.delivery.shoppingMode}</p>
                <p className="text-[10px] text-[var(--color-outline-variant)]">{t.rider.delivery.goToStore}</p>
                <p className="font-bold text-lg mt-2">{currentOrder.vendor}</p>
                <p className="text-sm text-[var(--color-outline)]">{currentOrder.vendorAddress}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-xl mb-4">
                <p className="text-[10px] text-purple-600 font-bold mb-3">{t.rider.delivery.itemsToBuy}</p>
                <div className="space-y-2">
                  {currentOrder.itemsList.map((item: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[var(--color-surface-container-lowest)] rounded-lg">
                      <span className="text-sm font-medium text-[var(--color-on-surface)]">• {item}</span>
                      <button
                        onClick={() => onSetPickedItems(prev => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i); else next.add(i);
                          return next;
                        })}
                        className={`text-[10px] px-2 py-1 rounded-full font-bold ${pickedItems.has(i) ? "bg-green-500 text-white" : "bg-green-100 text-green-700"}`}
                      >
                        {pickedItems.has(i) ? t.rider.delivery.picked : t.rider.delivery.pick}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {currentOrder.specialInstructions && (
                <div className="bg-amber-50 p-3 rounded-xl mb-4">
                  <p className="text-[10px] text-amber-600 font-bold mb-1">{t.rider.delivery.customerNotes}</p>
                  <p className="text-sm text-amber-800">{currentOrder.specialInstructions}</p>
                </div>
              )}

              <div className="bg-[var(--color-surface-subtle)] p-3 rounded-xl mb-4">
                <p className="text-[10px] text-[var(--color-outline-variant)] mb-2">{t.rider.delivery.deliverTo}</p>
                <p className="font-bold">{currentOrder.customer}</p>
                <p className="text-sm text-[var(--color-outline)]">{currentOrder.customerAddress}</p>
                <p className="text-xs text-[var(--color-outline-variant)]">📍 {currentOrder.landmark}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={onCallCustomer} className="flex-1 py-3 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-bold rounded-xl flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">call</span>{t.rider.delivery.callCustomer}
                </button>
                <button onClick={onStartChat} className="flex-1 py-3 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-bold rounded-xl flex items-center justify-center gap-2 relative">
                  <span className="material-symbols-outlined">chat</span>{t.rider.delivery.chat}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <Link href="/rider/orders" className="w-full mt-3 py-4 bg-purple-600 text-white font-black rounded-xl flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">inventory_2</span>{t.rider.delivery.goToShoppingList}
              </Link>

              <button onClick={onItemsCollected} className="w-full mt-3 py-3 bg-green-500 text-white font-bold rounded-xl">
                {t.rider.delivery.allItemsCollected}
              </button>
            </>
          )}

          {deliveryStep === "picking_up" && (
            <>
              <div className="mb-4">
                <p className="text-[10px] text-[var(--color-outline-variant)]">{t.rider.delivery.pickupFrom}</p>
                <p className="font-bold text-lg">{currentOrder.vendor}</p>
                <p className="text-sm text-[var(--color-outline)]">{currentOrder.vendorAddress}</p>
              </div>
              <div className="bg-[var(--color-surface-subtle)] p-3 rounded-xl mb-4">
                <p className="text-[10px] text-[var(--color-outline-variant)] mb-2">{t.rider.delivery.orderItems}</p>
                {currentOrder.itemsList.map((item, i) => (
                  <p key={i} className="text-sm text-[var(--color-on-surface-variant)]">• {item}</p>
                ))}
              </div>
              {currentOrder.type === "multi_stop" && currentOrder.stops && (
                <div className="bg-purple-50 p-3 rounded-xl mb-4">
                  <p className="text-[10px] text-purple-600 font-bold mb-2">{t.rider.delivery.deliveryStops}</p>
                  {currentOrder.stops.map((stop, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm py-1 ${i === currentStopIndex ? "text-purple-700 font-bold" : i < currentStopIndex ? "text-green-600 line-through" : "text-[var(--color-outline)]"}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${i === currentStopIndex ? "bg-purple-500 text-white" : i < currentStopIndex ? "bg-green-500 text-white" : "bg-[var(--color-surface-container-high)]"}`}>
                        {i < currentStopIndex ? "✓" : i + 1}
                      </span>
                      {stop.name}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={onCallCustomer} className="flex-1 py-3 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-bold rounded-xl flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">call</span>{t.rider.delivery.callVendor}
                </button>
                <button onClick={onStartChat} className="flex-1 py-3 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-bold rounded-xl flex items-center justify-center gap-2 relative">
                  <span className="material-symbols-outlined">chat</span>{t.rider.delivery.chat}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              <button onClick={onPickedUp} className="w-full mt-3 py-4 bg-green-500 text-white font-black rounded-xl">
                {currentOrder.type === "multi_stop" ? `${t.rider.delivery.startDeliveries} (${currentOrder.stops?.length} ${t.rider.order.stops})` : t.rider.delivery.pickedUpOrder}
              </button>
            </>
          )}

          {deliveryStep === "delivering" && currentOrder.type === "multi_stop" && currentOrder.stops ? (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold">
                    {t.rider.delivery.stop} {currentStopIndex + 1} {t.rider.delivery.of} {currentOrder.stops.length}
                  </span>
                  <span className="text-xs text-[var(--color-outline-variant)]">{currentOrder.stops[currentStopIndex].time}</span>
                </div>
                <p className="font-bold text-lg">{currentOrder.stops[currentStopIndex].name}</p>
                <p className="text-sm text-[var(--color-outline)]">{currentOrder.stops[currentStopIndex].address}</p>
                <p className="text-xs text-[var(--color-outline-variant)] mt-1">📍 {currentOrder.stops[currentStopIndex].landmark}</p>
              </div>
              <div className="bg-[var(--color-surface-subtle)] p-3 rounded-xl mb-4">
                <p className="text-[10px] text-[var(--color-outline-variant)] mb-2">{t.rider.delivery.upcomingStops}</p>
                {currentOrder.stops.slice(currentStopIndex + 1).map((stop, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[var(--color-outline)] py-1">
                    <span className="w-5 h-5 bg-[var(--color-surface-container-high)] rounded-full flex items-center justify-center text-[10px]">{currentStopIndex + i + 2}</span>
                    {stop.name} - {stop.distance}km
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={onCallCustomer} className="flex-1 py-3 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-bold rounded-xl flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">call</span>Call Customer
                </button>
                <button onClick={onStartChat} className="flex-1 py-3 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-bold rounded-xl flex items-center justify-center gap-2 relative">
                  <span className="material-symbols-outlined">chat</span>Chat
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              <button 
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
                        navigator.clipboard.writeText(url);
                        import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast(t.rider.delivery.locationCopied, "success"));
                      },
                      () => import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast(t.rider.delivery.locationError, "error"))
                    );
                  }
                }}
                className="w-full mt-3 py-2 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">share_location</span>{t.rider.delivery.shareLiveLocation}
              </button>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentOrder.stops[currentStopIndex].address)}`}
                target="_blank"
                className="w-full mt-2 py-3 bg-[#0b50d5] text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">navigation</span>{t.rider.delivery.navigateToStop}
              </a>
              <button onClick={onArrived} className="w-full mt-3 py-4 bg-green-500 text-white font-black rounded-xl">
                {t.rider.delivery.iveArrived}
              </button>
            </>
          ) : deliveryStep === "delivering" ? (
            <>
              <div className="mb-4">
                <p className="text-[10px] text-[var(--color-outline-variant)]">{t.rider.delivery.deliverTo}</p>
                <p className="font-bold text-lg">{currentOrder.customer}</p>
                <p className="text-sm text-[var(--color-outline)]">{currentOrder.customerAddress}</p>
                <p className="text-xs text-[var(--color-outline-variant)] mt-1">📍 {currentOrder.landmark}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={onCallCustomer} className="flex-1 py-3 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-bold rounded-xl flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">call</span>{t.rider.delivery.callCustomer}
                </button>
                <button onClick={onStartChat} className="flex-1 py-3 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-bold rounded-xl flex items-center justify-center gap-2 relative">
                  <span className="material-symbols-outlined">chat</span>{t.rider.delivery.chat}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              <button 
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
                        navigator.clipboard.writeText(url);
                        import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast(t.rider.delivery.locationCopied, "success"));
                      },
                      () => import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast(t.rider.delivery.locationError, "error"))
                    );
                  }
                }}
                className="w-full mt-3 py-2 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">share_location</span>{t.rider.delivery.shareLiveLocation}
              </button>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentOrder.customerAddress)}`}
                target="_blank"
                className="w-full mt-2 py-3 bg-[#0b50d5] text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">navigation</span>{t.rider.delivery.navigate}
              </a>
              <button onClick={onArrived} className="w-full mt-3 py-4 bg-green-500 text-white font-black rounded-xl">
                {t.rider.delivery.iveArrived}
              </button>
            </>
          ) : null}

          {deliveryStep === "arrived" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600 text-5xl">location_on</span>
              </div>
              <p className="font-bold text-xl mb-2">{t.rider.delivery.youveArrived}</p>
              <p className="text-sm text-[var(--color-outline)] mb-4">{t.rider.delivery.readyToComplete}</p>
              <button onClick={onComplete} className="w-full py-4 bg-green-500 text-white font-black rounded-xl">
                {t.rider.delivery.completeDelivery}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
