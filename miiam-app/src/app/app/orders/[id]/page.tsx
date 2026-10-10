"use client";

import { use, useState, useMemo, Suspense, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";
import OrderChatOverlay from "@/components/order/OrderChatOverlay";
import { useTranslation } from "@/lib/i18n/useTranslation";
import OrderHeader from "@/components/order/OrderHeader";
import OrderJourney from "@/components/order/OrderJourney";
import OrderItemsList from "@/components/order/OrderItemsList";
import OrderActions from "@/components/order/OrderActions";
import OrderCancelModal from "@/components/order/OrderCancelModal";

const RiderMap = dynamic(() => import("@/components/rider/RiderMap"), {
  ssr: false,
  loading: () => <div className="bg-surface-container h-64 animate-pulse rounded-2xl" />,
});
import RiderContactCard from "@/components/order/RiderContactCard";
import OrderStatusBanner from "@/components/order/OrderStatusBanner";
import PendingOrderCard from "@/components/order/PendingOrderCard";
import { useOrderTracking } from "@/lib/hooks/useOrderTracking";
import { restoreStock } from "@/lib/stock";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";
import { OrderSkeleton } from "@/components/Skeleton";

interface OrderPageData {
  id: string;
  status: string;
  user_id: string;
  vendor_id: string;
  rider_id: string | null;
  total_amount: number;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_address?: string | null;
  vendor_lat?: number;
  vendor_lng?: number;
  delay_minutes?: number;
  delay_reason?: string | null;
  estimated_prep_time?: number | null;
  placed_at?: string;
  accepted_at?: string | null;
  preparing_at?: string | null;
  ready_at?: string | null;
  shopping_at?: string | null;
  picked_at?: string | null;
  on_the_way_at?: string | null;
  arrived_at?: string | null;
  delivered_at?: string | null;
  processing_at?: string | null;
  riders?: { name?: string; profile_image?: string; rating?: number; phone?: string } | null;
  vendor?: { shop_name?: string; image_url?: string; logo_url?: string; address?: string } | null;
}

function EtaCountdown({ etaMinutes }: { etaMinutes: number }) {
  const [remaining, setRemaining] = useState(etaMinutes * 60);

  useEffect(() => {
    setRemaining(etaMinutes * 60);
  }, [etaMinutes]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <p className="text-accent text-xl leading-none font-black tabular-nums">
      {mins > 0 && (
        <>
          {mins}
          <span className="text-xs font-bold">m</span>{" "}
        </>
      )}
      <span className="text-xs font-bold">{secs}s</span>
    </p>
  );
}

function ShareOrderButton({ orderId, vendorName }: { orderId: string; vendorName?: string }) {
  const handleShare = useCallback(async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/app/orders/${orderId}`;
    const text = `Track my order from ${vendorName || "MIIAM"}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "MIIAM Order", text, url });
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* silent */
      }
    }
  }, [orderId, vendorName]);

  return (
    <button
      onClick={handleShare}
      className="bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-[var(--color-surface-container-high)]"
      aria-label="Share order"
    >
      <span className="material-symbols-outlined text-on-surface">share</span>
    </button>
  );
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "";
  }
}

interface TranslationKeys {
  orders: {
    orderPlaced: string;
    orderAccepted: string;
    preparing: string;
    readyForPickup: string;
    shopping: string;
    pickingUp: string;
    onTheWay: string;
    arrived: string;
    delivered: string;
  };
}

interface OrderTimestamps {
  placed_at?: string | null;
  accepted_at?: string | null;
  preparing_at?: string | null;
  ready_at?: string | null;
  shopping_at?: string | null;
  picked_at?: string | null;
  on_the_way_at?: string | null;
  arrived_at?: string | null;
  delivered_at?: string | null;
  processing_at?: string | null;
  [key: string]: unknown;
}

function getFoodSteps(t: TranslationKeys, order?: OrderTimestamps) {
  return [
    {
      key: "pending",
      label: t.orders.orderPlaced,
      icon: "receipt_long",
      time: formatTimestamp(order?.placed_at),
    },
    {
      key: "accepted",
      label: t.orders.orderAccepted,
      icon: "check_circle",
      time: formatTimestamp(order?.accepted_at),
    },
    {
      key: "preparing",
      label: t.orders.preparing,
      icon: "skillet",
      time: formatTimestamp(order?.preparing_at),
    },
    {
      key: "ready_for_pickup",
      label: t.orders.readyForPickup,
      icon: "inventory_2",
      time: formatTimestamp(order?.ready_at),
    },
    {
      key: "shopping",
      label: t.orders.shopping,
      icon: "shopping_cart",
      time: formatTimestamp(order?.shopping_at),
    },
    {
      key: "picked_up",
      label: t.orders.onTheWay,
      icon: "directions_bike",
      time: formatTimestamp(order?.picked_at),
    },
    {
      key: "delivered",
      label: t.orders.delivered,
      icon: "home_pin",
      time: formatTimestamp(order?.delivered_at),
    },
  ];
}

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const supabase = useMemo(() => createClient(), []);
  const { addToast } = useToastStore();
  const [showHelp, setShowHelp] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [showChat, setShowChat] = useState<"rider" | "vendor" | null>(null);

  const {
    order,
    setOrder,
    loading,
    riderLocation,
    trackingInfo,
    setTrackingInfo,
    isRefreshing,
    refreshOrder,
    currentUserId,
  } = useOrderTracking(id, supabase);

  const pageOrder = order as unknown as OrderPageData | null;

  const { unreadByOrder } = useUnreadMessages(currentUserId);
  const unreadCount = unreadByOrder[id] || 0;

  const canCancel = !!(pageOrder && ["pending", "accepted"].includes(pageOrder.status));

  const handleCancelOrder = async (reason?: string) => {
    try {
      const updates: Partial<Record<string, string>> = { status: "cancelled" };
      if (reason) updates.cancel_reason = reason;
      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", id)
        .eq("user_id", currentUserId);
      if (error) throw error;
      await restoreStock(id);
      setOrder((prev) => (prev ? { ...prev, ...updates } : prev));
      addToast(t.orders.orderCancelledSuccess, "success");
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Cancel error"
      );
      addToast(t.orders.cancelFailed, "error");
    }
    setShowCancelReason(false);
  };

  const riderInfo = pageOrder?.riders
    ? {
        name: pageOrder.riders.name || t.orders.rider,
        image:
          pageOrder.riders.profile_image ||
          "https://ui-avatars.com/api/?name=Rider&background=0c831f&color=fff",
        rating: pageOrder.riders.rating || 4.9,
        phone: pageOrder.riders.phone,
      }
    : {
        name: t.orders.assigningRider,
        image: "https://ui-avatars.com/api/?name=Rider&background=0c831f&color=fff",
        rating: 0,
      };

  if (loading) {
    return (
      <div
        className="bg-surface min-h-screen p-4 dark:bg-[var(--color-surface)]"
        aria-label="Loading..."
      >
        <OrderSkeleton />
      </div>
    );
  }

  if (!pageOrder) {
    return (
      <div className="bg-surface text-on-surface flex min-h-screen flex-col items-center justify-center p-6 dark:bg-[var(--color-surface)] dark:text-[var(--color-on-surface)]">
        <span className="mb-4 text-6xl">🔍</span>
        <h2 className="mb-2 text-xl font-bold">{t.orders.orderNotFound}</h2>
        <p className="text-on-surface-variant mb-6 text-center dark:text-[var(--color-outline)]">
          {t.orders.orderNotFoundDesc}
        </p>
        <Link
          href="/app/orders"
          className="bg-primary text-on-primary rounded-xl px-6 py-3 font-bold"
        >
          {t.orders.viewAllOrders}
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="text-on-surface-variant mt-4 text-sm dark:text-[var(--color-outline)]"
        >
          {t.orders.reloadPage}
        </button>
      </div>
    );
  }

  const steps = getFoodSteps(t, pageOrder as unknown as OrderTimestamps);
  const currentStepIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === pageOrder.status)
  );

  return (
    <div className="bg-surface min-h-screen overflow-x-hidden dark:bg-[var(--color-surface)]">
      <OrderHeader
        orderId={id}
        isRefreshing={isRefreshing}
        onRefresh={refreshOrder}
        extraActions={<ShareOrderButton orderId={id} vendorName={pageOrder?.vendor?.shop_name} />}
      />
      <div className="from-surface-container mt-16 h-2 bg-gradient-to-b to-transparent" />

      <main className="min-h-screen pt-6 pb-12">
        <div className="mx-auto max-w-7xl items-start px-3 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="space-y-4 sm:space-y-6 lg:col-span-7">
            <div className="relative h-[300px] w-full overflow-hidden rounded-2xl shadow-sm sm:h-[420px]">
              {/* Live status bar */}
              {trackingInfo && (
                <div className="absolute top-3 right-3 left-3 z-[10] flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full bg-[var(--color-surface-container-lowest)]/95 px-4 py-2.5 shadow-lg backdrop-blur">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold tracking-wider text-green-700 uppercase dark:text-green-400">
                      Live
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface-container-lowest)]/95 px-4 py-2.5 shadow-lg backdrop-blur">
                    <div className="text-center">
                      <p className="text-[10px] font-bold tracking-wider text-[var(--color-on-surface-variant)] uppercase">
                        {t.orders.eta}
                      </p>
                      <EtaCountdown etaMinutes={trackingInfo.eta} />
                    </div>
                    <div className="h-8 w-px bg-[var(--color-outline)]/20" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold tracking-wider text-[var(--color-on-surface-variant)] uppercase">
                        Distance
                      </p>
                      <p className="text-on-surface text-sm leading-none font-black">
                        {trackingInfo.distance} km
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <RiderMap
                dropoff={{
                  lat: pageOrder?.delivery_lat || 0,
                  lng: pageOrder?.delivery_lng || 0,
                  label: pageOrder?.delivery_address || "",
                  kind: "home",
                }}
                pickup={
                  pageOrder?.vendor?.address
                    ? {
                        lat: pageOrder?.vendor_lat || 0,
                        lng: pageOrder?.vendor_lng || 0,
                        label: pageOrder.vendor.address,
                        kind: "vendor",
                      }
                    : null
                }
                riderLocation={riderLocation}
                onRouteUpdate={setTrackingInfo}
              />
            </div>

            {pageOrder?.delay_minutes && pageOrder.delay_minutes > 0 && (
              <OrderStatusBanner
                type="delay"
                delayMinutes={pageOrder.delay_minutes}
                delayReason={pageOrder.delay_reason ?? undefined}
              />
            )}

            {pageOrder?.estimated_prep_time &&
              !pageOrder.delay_minutes &&
              ["accepted", "preparing"].includes(pageOrder.status) && (
                <OrderStatusBanner
                  type="prep_time"
                  estimatedPrepTime={pageOrder.estimated_prep_time}
                  placedAt={pageOrder.placed_at}
                  preparingLabel={t.orders.preparingOrder}
                />
              )}

            {pageOrder.status !== "pending" && pageOrder.riders && (
              <RiderContactCard
                name={riderInfo.name}
                image={riderInfo.image}
                rating={riderInfo.rating}
                phone={riderInfo.phone}
                orderId={id}
                currentUserId={currentUserId}
                orderStatus={pageOrder.status}
                unreadCount={unreadCount}
                onChat={() => setShowChat("rider")}
              />
            )}

            {pageOrder.status === "pending" && (
              <PendingOrderCard
                type="food"
                findingRiderLabel={t.orders.findingRider}
                riderWillAcceptLabel={t.orders.riderWillAccept}
              />
            )}
          </div>

          <div className="mt-6 space-y-4 sm:space-y-6 lg:col-span-5 lg:mt-0">
            <OrderJourney
              steps={steps}
              currentStepIndex={currentStepIndex}
              trackingInfo={trackingInfo}
            />
            <OrderItemsList
              order={
                order as Record<string, unknown> & { id: string; vendor_id: string; status: string }
              }
              onChatVendor={() => setShowChat("vendor")}
            />
            <OrderActions
              order={pageOrder}
              canCancel={canCancel}
              showHelp={showHelp}
              onToggleHelp={() => setShowHelp(!showHelp)}
              onShowCancelReason={() => setShowCancelReason(true)}
            />
            <OrderCancelModal
              open={showCancelReason}
              onClose={() => setShowCancelReason(false)}
              onCancel={handleCancelOrder}
            />
          </div>
        </div>

        {showChat && currentUserId && (
          <OrderChatOverlay
            orderId={id}
            currentUserId={currentUserId}
            senderType="user"
            thread={showChat === "vendor" ? "user-vendor" : "user-rider"}
            otherName={
              showChat === "vendor"
                ? pageOrder.vendor?.shop_name || "Restaurant"
                : riderInfo?.name || t.orders.rider
            }
            otherAvatar={
              showChat === "vendor"
                ? pageOrder.vendor?.image_url || pageOrder.vendor?.logo_url || undefined
                : riderInfo?.image
            }
            onClose={() => setShowChat(null)}
          />
        )}
      </main>
    </div>
  );
}
