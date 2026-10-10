"use client";

import { memo } from "react";
import Link from "next/link";
import type { OrderWithTiming } from "@/app/rider/dashboard/types";
import { calculatePeakEarnings } from "@/app/rider/dashboard/utils";
import CustomerLocationView from "@/components/rider/CustomerLocationView";
import ShareLiveLocationButton from "@/components/rider/ShareLiveLocationButton";
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

function ActiveDeliveryView({
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
  const headerBg =
    deliveryStep === "shopping"
      ? "bg-accent"
      : deliveryStep === "picking_up"
        ? "bg-brand-secondary"
        : deliveryStep === "delivering"
          ? "bg-[var(--color-on-surface)]"
          : "bg-green-600";

  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center px-4 pb-24">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--color-surface-container-lowest)] shadow-2xl">
        {activeOrders.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2">
            <span className="material-symbols-outlined text-sm text-[var(--color-outline-variant)]">
              stack
            </span>
            {activeOrders.map((ao) => (
              <button
                key={ao.id}
                onClick={() => {
                  onSetCurrentOrder(ao);
                  onSetDeliveryStep("shopping");
                }}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
                  currentOrder?.id === ao.id
                    ? "bg-brand-secondary text-white"
                    : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] text-[var(--color-outline)]"
                }`}
              >
                #{ao.id.slice(-4).toUpperCase()}
              </button>
            ))}
          </div>
        )}

        <div className={`p-4 text-white ${headerBg}`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {deliveryStep === "picking_up"
                  ? "restaurant"
                  : deliveryStep === "delivering"
                    ? "local_shipping"
                    : "location_on"}
              </span>
              <span className="text-sm font-bold uppercase">
                {currentOrder.type === "multi_stop"
                  ? deliveryStep === "picking_up"
                    ? t.rider.delivery.pickupStep
                    : deliveryStep === "delivering"
                      ? `${t.rider.delivery.stop} ${currentStopIndex + 1}/${currentOrder.stops?.length}`
                      : t.rider.delivery.completeStep
                  : deliveryStep === "shopping"
                    ? t.rider.delivery.shopItemsLabel
                    : deliveryStep === "picking_up"
                      ? t.rider.delivery.pickupStep
                      : deliveryStep === "delivering"
                        ? t.rider.delivery.deliveringLabel
                        : t.rider.delivery.arrivedLabel}
              </span>
              {currentOrder.type === "multi_stop" && (
                <span className="rounded bg-white/20 px-2 py-0.5 text-[10px]">
                  {t.rider.delivery.batch}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">₹{calculatePeakEarnings(currentOrder)}</p>
            </div>
          </div>

          {currentOrder.type === "multi_stop" && currentOrder.stops && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-[9px]">
                <span className="opacity-70">{t.rider.delivery.progress}</span>
                <span>
                  {currentStopIndex + 1}/{currentOrder.stops.length} {t.rider.delivery.stops}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-white transition-all"
                  style={{
                    width: `${((currentStopIndex + 1) / currentOrder.stops.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {(deliveryStep === "delivering" || deliveryStep === "arrived") &&
            currentOrder.orderDbId && (
              <div className="bg-[var(--color-surface-container-lowest)]">
                <CustomerLocationView
                  orderId={currentOrder.orderDbId}
                  className="rounded-none border-0"
                  height={170}
                />
              </div>
            )}

          <div className="flex items-center justify-between text-[10px]">
            {currentOrder.type === "multi_stop" ? (
              <>
                <div
                  className={`flex flex-col items-center ${deliveryStep === "picking_up" ? "text-white" : "text-white/50"}`}
                >
                  <div
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full ${deliveryStep === "picking_up" ? "text-brand-secondary bg-[var(--color-surface-container-lowest)]" : "bg-white/30"}`}
                  >
                    1
                  </div>
                  <span>{t.rider.delivery.pickupStep}</span>
                </div>
                <div className="mx-2 h-0.5 flex-1 bg-white/30">
                  <div
                    className={`h-full bg-white ${deliveryStep !== "picking_up" ? "w-full" : "w-0"}`}
                  ></div>
                </div>
                <div
                  className={`flex flex-col items-center ${deliveryStep === "delivering" || deliveryStep === "arrived" ? "text-white" : "text-white/50"}`}
                >
                  <div
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full ${deliveryStep === "delivering" || deliveryStep === "arrived" ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]" : "bg-white/30"}`}
                  >
                    2
                  </div>
                  <span>{t.rider.delivery.deliveriesStep}</span>
                </div>
                <div className="mx-2 h-0.5 flex-1 bg-white/30">
                  <div
                    className={`h-full bg-white ${deliveryStep === "arrived" ? "w-full" : "w-0"}`}
                  ></div>
                </div>
                <div
                  className={`flex flex-col items-center ${deliveryStep === "arrived" ? "text-white" : "text-white/50"}`}
                >
                  <div
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full ${deliveryStep === "arrived" ? "bg-[var(--color-surface-container-lowest)] text-green-600" : "bg-white/30"}`}
                  >
                    3
                  </div>
                  <span>{t.rider.delivery.completeStep}</span>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`flex flex-col items-center ${deliveryStep === "shopping" ? "text-white" : "text-white/50"}`}
                >
                  <div
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full ${deliveryStep === "shopping" ? "text-accent bg-[var(--color-surface-container-lowest)]" : "bg-white/30"}`}
                  >
                    1
                  </div>
                  <span>{t.rider.delivery.shopStep}</span>
                </div>
                <div className="mx-2 h-0.5 flex-1 bg-white/30">
                  <div
                    className={`h-full bg-white ${["picking_up", "delivering", "arrived"].includes(deliveryStep) ? "w-full" : "w-0"}`}
                  ></div>
                </div>
                <div
                  className={`flex flex-col items-center ${["picking_up", "delivering", "arrived"].includes(deliveryStep) ? "text-white" : "text-white/50"}`}
                >
                  <div
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full ${["picking_up", "delivering", "arrived"].includes(deliveryStep) ? "text-brand-secondary bg-[var(--color-surface-container-lowest)]" : "bg-white/30"}`}
                  >
                    2
                  </div>
                  <span>{t.rider.delivery.deliverStep}</span>
                </div>
                <div className="mx-2 h-0.5 flex-1 bg-white/30">
                  <div
                    className={`h-full bg-white ${deliveryStep === "arrived" ? "w-full" : "w-0"}`}
                  ></div>
                </div>
                <div
                  className={`flex flex-col items-center ${deliveryStep === "arrived" ? "text-white" : "text-white/50"}`}
                >
                  <div
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full ${deliveryStep === "arrived" ? "bg-[var(--color-surface-container-lowest)] text-green-600" : "bg-white/30"}`}
                  >
                    3
                  </div>
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
                <p className="text-accent mb-2 text-[10px] font-bold">
                  {t.rider.delivery.shoppingMode}
                </p>
                <p className="text-[10px] text-[var(--color-outline-variant)]">
                  {t.rider.delivery.goToStore}
                </p>
                <p className="mt-2 text-lg font-bold">{currentOrder.vendor}</p>
                <p className="text-sm text-[var(--color-outline)]">{currentOrder.vendorAddress}</p>
              </div>

              <div className="bg-accent/10 mb-4 rounded-xl p-4">
                <p className="text-accent mb-3 text-[10px] font-bold">
                  {t.rider.delivery.itemsToBuy}
                </p>
                <div className="space-y-2">
                  {currentOrder.itemsList.map((item: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-[var(--color-surface-container-lowest)] p-2"
                    >
                      <span className="text-sm font-medium text-[var(--color-on-surface)]">
                        • {item}
                      </span>
                      <button
                        onClick={() =>
                          onSetPickedItems((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          })
                        }
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${pickedItems.has(i) ? "bg-status-success text-white" : "bg-status-success/10 text-status-success"}`}
                      >
                        {pickedItems.has(i) ? t.rider.delivery.picked : t.rider.delivery.pick}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {currentOrder.specialInstructions && (
                <div className="mb-4 rounded-xl bg-amber-50 p-3">
                  <p className="mb-1 text-[10px] font-bold text-amber-600">
                    {t.rider.delivery.customerNotes}
                  </p>
                  <p className="text-sm text-amber-800">{currentOrder.specialInstructions}</p>
                </div>
              )}

              <div className="mb-4 rounded-xl bg-[var(--color-surface-subtle)] p-3">
                <p className="mb-2 text-[10px] text-[var(--color-outline-variant)]">
                  {t.rider.delivery.deliverTo}
                </p>
                <p className="font-bold">{currentOrder.customer}</p>
                <p className="text-sm text-[var(--color-outline)]">
                  {currentOrder.customerAddress}
                </p>
                <p className="text-xs text-[var(--color-outline-variant)]">
                  📍 {currentOrder.landmark}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onCallCustomer}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-container)] py-3 font-bold text-[var(--color-on-surface)]"
                >
                  <span className="material-symbols-outlined">call</span>
                  {t.rider.delivery.callCustomer}
                </button>
                <button
                  onClick={onStartChat}
                  className="relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-container)] py-3 font-bold text-[var(--color-on-surface)]"
                >
                  <span className="material-symbols-outlined">chat</span>
                  {t.rider.delivery.chat}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <Link
                href="/rider/orders"
                className="bg-accent mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-black text-white"
              >
                <span className="material-symbols-outlined">inventory_2</span>
                {t.rider.delivery.goToShoppingList}
              </Link>

              <button
                onClick={onItemsCollected}
                className="bg-status-success mt-3 w-full rounded-xl py-3 font-bold text-white"
              >
                {t.rider.delivery.allItemsCollected}
              </button>
            </>
          )}

          {deliveryStep === "picking_up" && (
            <>
              <div className="mb-4">
                <p className="text-[10px] text-[var(--color-outline-variant)]">
                  {t.rider.delivery.pickupFrom}
                </p>
                <p className="text-lg font-bold">{currentOrder.vendor}</p>
                <p className="text-sm text-[var(--color-outline)]">{currentOrder.vendorAddress}</p>
              </div>
              <div className="mb-4 rounded-xl bg-[var(--color-surface-subtle)] p-3">
                <p className="mb-2 text-[10px] text-[var(--color-outline-variant)]">
                  {t.rider.delivery.orderItems}
                </p>
                {currentOrder.itemsList.map((item, i) => (
                  <p key={i} className="text-sm text-[var(--color-on-surface-variant)]">
                    • {item}
                  </p>
                ))}
              </div>
              {currentOrder.type === "multi_stop" && currentOrder.stops && (
                <div className="bg-accent/10 mb-4 rounded-xl p-3">
                  <p className="text-accent mb-2 text-[10px] font-bold">
                    {t.rider.delivery.deliveryStops}
                  </p>
                  {currentOrder.stops.map((stop, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 py-1 text-sm ${i === currentStopIndex ? "text-accent font-bold" : i < currentStopIndex ? "text-green-600 line-through" : "text-[var(--color-outline)]"}`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${i === currentStopIndex ? "bg-accent text-white" : i < currentStopIndex ? "bg-green-500 text-white" : "bg-[var(--color-surface-container-high)]"}`}
                      >
                        {i < currentStopIndex ? "✓" : i + 1}
                      </span>
                      {stop.name}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={onCallCustomer}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-container)] py-3 font-bold text-[var(--color-on-surface)]"
                >
                  <span className="material-symbols-outlined">call</span>
                  {t.rider.delivery.callVendor}
                </button>
                <button
                  onClick={onStartChat}
                  className="relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-container)] py-3 font-bold text-[var(--color-on-surface)]"
                >
                  <span className="material-symbols-outlined">chat</span>
                  {t.rider.delivery.chat}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              <button
                onClick={onPickedUp}
                className="bg-status-success mt-3 w-full rounded-xl py-4 font-black text-white"
              >
                {currentOrder.type === "multi_stop"
                  ? `${t.rider.delivery.startDeliveries} (${currentOrder.stops?.length} ${t.rider.order.stops})`
                  : t.rider.delivery.pickedUpOrder}
              </button>
            </>
          )}

          {deliveryStep === "delivering" &&
          currentOrder.type === "multi_stop" &&
          currentOrder.stops ? (
            <>
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="bg-accent/10 text-accent rounded-full px-2 py-1 text-[10px] font-bold">
                    {t.rider.delivery.stop} {currentStopIndex + 1} {t.rider.delivery.of}{" "}
                    {currentOrder.stops.length}
                  </span>
                  <span className="text-xs text-[var(--color-outline-variant)]">
                    {currentOrder.stops[currentStopIndex].time}
                  </span>
                </div>
                <p className="text-lg font-bold">{currentOrder.stops[currentStopIndex].name}</p>
                <p className="text-sm text-[var(--color-outline)]">
                  {currentOrder.stops[currentStopIndex].address}
                </p>
                <p className="mt-1 text-xs text-[var(--color-outline-variant)]">
                  📍 {currentOrder.stops[currentStopIndex].landmark}
                </p>
              </div>
              <div className="mb-4 rounded-xl bg-[var(--color-surface-subtle)] p-3">
                <p className="mb-2 text-[10px] text-[var(--color-outline-variant)]">
                  {t.rider.delivery.upcomingStops}
                </p>
                {currentOrder.stops.slice(currentStopIndex + 1).map((stop, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-1 text-sm text-[var(--color-outline)]"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-[10px]">
                      {currentStopIndex + i + 2}
                    </span>
                    {stop.name} - {stop.distance}km
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onCallCustomer}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-container)] py-3 font-bold text-[var(--color-on-surface)]"
                >
                  <span className="material-symbols-outlined">call</span>Call Customer
                </button>
                <button
                  onClick={onStartChat}
                  className="relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-container)] py-3 font-bold text-[var(--color-on-surface)]"
                >
                  <span className="material-symbols-outlined">chat</span>Chat
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              <ShareLiveLocationButton className="mt-3 w-full" />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentOrder.stops[currentStopIndex].address)}`}
                target="_blank"
                className="bg-brand-secondary mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white"
              >
                <span className="material-symbols-outlined">navigation</span>
                {t.rider.delivery.navigateToStop}
              </a>
              <button
                onClick={onArrived}
                className="bg-status-success mt-3 w-full rounded-xl py-4 font-black text-white"
              >
                {t.rider.delivery.iveArrived}
              </button>
            </>
          ) : deliveryStep === "delivering" ? (
            <>
              <div className="mb-4">
                <p className="text-[10px] text-[var(--color-outline-variant)]">
                  {t.rider.delivery.deliverTo}
                </p>
                <p className="text-lg font-bold">{currentOrder.customer}</p>
                <p className="text-sm text-[var(--color-outline)]">
                  {currentOrder.customerAddress}
                </p>
                <p className="mt-1 text-xs text-[var(--color-outline-variant)]">
                  📍 {currentOrder.landmark}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onCallCustomer}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-container)] py-3 font-bold text-[var(--color-on-surface)]"
                >
                  <span className="material-symbols-outlined">call</span>
                  {t.rider.delivery.callCustomer}
                </button>
                <button
                  onClick={onStartChat}
                  className="relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-container)] py-3 font-bold text-[var(--color-on-surface)]"
                >
                  <span className="material-symbols-outlined">chat</span>
                  {t.rider.delivery.chat}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              <ShareLiveLocationButton className="mt-3 w-full" />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentOrder.customerAddress)}`}
                target="_blank"
                className="bg-brand-secondary mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white"
              >
                <span className="material-symbols-outlined">navigation</span>
                {t.rider.delivery.navigate}
              </a>
              <button
                onClick={onArrived}
                className="bg-status-success mt-3 w-full rounded-xl py-4 font-black text-white"
              >
                {t.rider.delivery.iveArrived}
              </button>
            </>
          ) : null}

          {deliveryStep === "arrived" && (
            <div className="text-center">
              <div className="bg-status-success/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <span className="material-symbols-outlined text-status-success text-5xl">
                  location_on
                </span>
              </div>
              <p className="mb-2 text-xl font-bold">{t.rider.delivery.youveArrived}</p>
              <p className="mb-4 text-sm text-[var(--color-outline)]">
                {t.rider.delivery.readyToComplete}
              </p>
              <button
                onClick={onComplete}
                className="bg-status-success w-full rounded-xl py-4 font-black text-white"
              >
                {t.rider.delivery.completeDelivery}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ActiveDeliveryView);
