"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import OrderChatOverlay from "@/components/order/OrderChatOverlay";
import RiderMap from "@/components/rider/RiderMap";
import { PRINTING_VENDOR_ID } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import OrderHeader from "@/components/order/OrderHeader";
import OrderJourney from "@/components/order/OrderJourney";
import OrderItemsList from "@/components/order/OrderItemsList";
import OrderActions from "@/components/order/OrderActions";
import OrderCancelModal from "@/components/order/OrderCancelModal";
import RiderContactCard from "@/components/order/RiderContactCard";
import OrderStatusBanner from "@/components/order/OrderStatusBanner";
import PendingOrderCard from "@/components/order/PendingOrderCard";
import { useOrderTracking } from "@/lib/hooks/useOrderTracking";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "";
  }
}

function getFoodSteps(t: any, order?: any) {
  return [
    { key: "pending", label: t.orders.orderPlaced, icon: "receipt_long", time: formatTimestamp(order?.placed_at) },
    { key: "accepted", label: t.orders.orderAccepted, icon: "check_circle", time: formatTimestamp(order?.accepted_at) },
    { key: "preparing", label: t.orders.preparing, icon: "skillet", time: formatTimestamp(order?.preparing_at) },
    { key: "ready_for_pickup", label: t.orders.readyForPickup, icon: "inventory_2", time: formatTimestamp(order?.ready_at) },
    { key: "shopping", label: t.orders.shopping, icon: "shopping_cart", time: formatTimestamp(order?.shopping_at) },
    { key: "picking_up", label: t.orders.pickingUp, icon: "storefront", time: formatTimestamp(order?.picked_at) },
    { key: "on_the_way", label: t.orders.onTheWay, icon: "directions_bike", time: formatTimestamp(order?.on_the_way_at) },
    { key: "arrived", label: t.orders.arrived, icon: "location_on", time: formatTimestamp(order?.arrived_at) },
    { key: "delivered", label: t.orders.delivered, icon: "home_pin", time: formatTimestamp(order?.delivered_at) },
  ];
}

function getPrintSteps(t: any, order?: any) {
  return [
    { key: "pending", label: t.orders.orderPlaced, icon: "receipt_long", time: formatTimestamp(order?.placed_at) },
    { key: "processing", label: t.orders.printingInProgress, icon: "print", time: formatTimestamp(order?.processing_at) },
    { key: "ready_for_pickup", label: t.orders.readyForPickup, icon: "inventory_2", time: formatTimestamp(order?.ready_at) },
    { key: "on_the_way", label: t.orders.onTheWay, icon: "directions_bike", time: formatTimestamp(order?.on_the_way_at) },
    { key: "arrived", label: t.orders.arrived, icon: "location_on", time: formatTimestamp(order?.arrived_at) },
    { key: "delivered", label: t.orders.delivered, icon: "home_pin", time: formatTimestamp(order?.delivered_at) },
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

  const { unreadByOrder } = useUnreadMessages(currentUserId);
  const unreadCount = unreadByOrder[id] || 0;

  const canCancel = order && ["pending", "accepted"].includes(order.status);

  const handleCancelOrder = async (reason?: string) => {
    try {
      const updates: Record<string, any> = { status: "cancelled" };
      if (reason) updates.cancel_reason = reason;
      const { error } = await supabase.from("orders").update(updates).eq("id", id).eq("user_id", currentUserId);
      if (error) throw error;
      setOrder((prev: any) => prev ? { ...prev, ...updates } : prev);
      addToast(t.orders.orderCancelledSuccess, "success");
    } catch (error) {
      console.error("Cancel error:", error);
      addToast(t.orders.cancelFailed, "error");
    }
    setShowCancelReason(false);
  };

  const riderInfo = order?.riders
    ? {
        name: order.riders.name || t.orders.rider,
        image: order.riders.profile_image || "https://ui-avatars.com/api/?name=Rider&background=0b50d5&color=fff",
        rating: order.riders.rating || 4.9,
        phone: order.riders.phone,
      }
    : {
        name: t.orders.assigningRider,
        image: "https://ui-avatars.com/api/?name=Rider&background=0b50d5&color=fff",
        rating: 0,
      };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface p-6">
        <span className="text-6xl mb-4">🔍</span>
        <h2 className="text-xl font-bold mb-2">{t.orders.orderNotFound}</h2>
        <p className="text-on-surface-variant text-center mb-6">{t.orders.orderNotFoundDesc}</p>
        <Link href="/app/orders" className="bg-primary text-white px-6 py-3 rounded-xl font-bold">
          {t.orders.viewAllOrders}
        </Link>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm text-on-surface-variant">
          {t.orders.reloadPage}
        </button>
      </div>
    );
  }

  const steps = order?.vendor_id === PRINTING_VENDOR_ID ? getPrintSteps(t, order) : getFoodSteps(t, order);
  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      <OrderHeader orderId={id} isRefreshing={isRefreshing} onRefresh={refreshOrder} />
      <div className="bg-gradient-to-b from-surface-container to-transparent h-2 mt-16" />

      <main className="pt-6 pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-10 items-start">
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {order?.vendor_id !== PRINTING_VENDOR_ID && (
              <div className="relative w-full h-[260px] sm:h-[420px] rounded-2xl overflow-hidden shadow-sm">
                {trackingInfo && (
                  <div className="absolute top-4 right-4 bg-[var(--color-surface-container-lowest)]/90 backdrop-blur rounded-full px-4 py-3 shadow-lg flex items-center gap-2" style={{ zIndex: 10 }}>
                    <div className="text-center">
                      <p className="text-[10px] text-[var(--color-on-surface)] font-bold uppercase tracking-wider">{t.orders.eta}</p>
                      <p className="text-xl font-black text-primary leading-none">{trackingInfo.eta} <span className="text-xs">{t.orders.minsUnit}</span></p>
                      <p className="text-[10px] text-[var(--color-on-surface)] font-medium">{trackingInfo.distance} km · {trackingInfo.leg === "to_pickup" ? t.orders.toPickup : t.orders.toYou}</p>
                    </div>
                  </div>
                )}
                <RiderMap
                  dropoff={{ lat: order?.delivery_lat || 0, lng: order?.delivery_lng || 0, label: order?.delivery_address || "", kind: "home" }}
                  pickup={order?.vendor?.address ? { lat: order?.vendor_lat || 0, lng: order?.vendor_lng || 0, label: order.vendor.address, kind: "vendor" } : null}
                  riderLocation={riderLocation}
                  onRouteUpdate={setTrackingInfo}
                />
              </div>
            )}

            {order?.delay_minutes > 0 && (
              <OrderStatusBanner type="delay" delayMinutes={order.delay_minutes} delayReason={order.delay_reason} />
            )}

            {order?.estimated_prep_time && !order.delay_minutes && ["accepted", "preparing"].includes(order.status) && (
              <OrderStatusBanner type="prep_time" estimatedPrepTime={order.estimated_prep_time} placedAt={order.placed_at} preparingLabel={t.orders.preparingOrder} />
            )}

            {order.status !== "pending" && order.riders && (
              <RiderContactCard
                name={riderInfo.name}
                image={riderInfo.image}
                rating={riderInfo.rating}
                phone={riderInfo.phone}
                orderId={id}
                currentUserId={currentUserId}
                orderStatus={order.status}
                unreadCount={unreadCount}
                onChat={() => setShowChat("rider")}
              />
            )}

            {order.status === "pending" && order.vendor_id !== PRINTING_VENDOR_ID && (
              <PendingOrderCard type="food" findingRiderLabel={t.orders.findingRider} riderWillAcceptLabel={t.orders.riderWillAccept} />
            )}

            {order.status === "pending" && order.vendor_id === PRINTING_VENDOR_ID && (
              <PendingOrderCard type="print" />
            )}
          </div>

          <div className="lg:col-span-5 space-y-4 sm:space-y-6 mt-6 lg:mt-0">
            <OrderJourney steps={steps} currentStepIndex={currentStepIndex} trackingInfo={trackingInfo} />
            <OrderItemsList order={order} onChatVendor={() => setShowChat("vendor")} />
            <OrderActions order={order} canCancel={canCancel} showHelp={showHelp} onToggleHelp={() => setShowHelp(!showHelp)} onShowCancelReason={() => setShowCancelReason(true)} />
            <OrderCancelModal open={showCancelReason} onClose={() => setShowCancelReason(false)} onCancel={handleCancelOrder} />
          </div>
        </div>

        {showChat && currentUserId && (
          <OrderChatOverlay
            orderId={id}
            currentUserId={currentUserId}
            senderType="user"
            thread={showChat === "vendor" ? "user-vendor" : "user-rider"}
            otherName={showChat === "vendor" ? (order.vendor?.name || (order.vendor_id === PRINTING_VENDOR_ID ? t.orders.printStore : "Restaurant")) : (riderInfo?.name || t.orders.rider)}
            otherAvatar={showChat === "vendor" ? order.vendor?.image_url || order.vendor?.logo_url || undefined : riderInfo?.image}
            onClose={() => setShowChat(null)}
          />
        )}
      </main>
    </div>
  );
}
