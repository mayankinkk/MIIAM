"use client";

import { use, useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import BlurImage from "@/components/BlurImage";
import OrderChatOverlay from "@/components/order/OrderChatOverlay";
import PrintButton from "@/components/print/PrintButton";
import { usePrintLibraryStore } from "@/lib/store/printLibraryStore";
import RiderMap from "@/components/rider/RiderMap";
import ShareLocationToggle from "@/components/rider/ShareLocationToggle";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";
import { PRINTING_VENDOR_ID } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";

const foodSteps = [
  { key: "pending", label: "Order Placed", icon: "receipt_long", time: "" },
  { key: "accepted", label: "Order Accepted", icon: "check_circle", time: "" },
  { key: "preparing", label: "Preparing", icon: "skillet", time: "" },
  { key: "ready_for_pickup", label: "Ready for Pickup", icon: "inventory_2", time: "" },
  { key: "shopping", label: "Shopping", icon: "shopping_cart", time: "" },
  { key: "picking_up", label: "Picking Up", icon: "storefront", time: "" },
  { key: "on_the_way", label: "On the Way", icon: "directions_bike", time: "" },
  { key: "arrived", label: "Arrived", icon: "location_on", time: "" },
  { key: "delivered", label: "Delivered", icon: "home_pin", time: "" },
];

const printSteps = [
  { key: "pending", label: "Order Placed", icon: "receipt_long", time: "" },
  { key: "processing", label: "Printing in Progress", icon: "print", time: "" },
  { key: "ready_for_pickup", label: "Ready for Pickup", icon: "inventory_2", time: "" },
  { key: "on_the_way", label: "On the Way", icon: "directions_bike", time: "" },
  { key: "arrived", label: "Arrived", icon: "location_on", time: "" },
  { key: "delivered", label: "Delivered", icon: "home_pin", time: "" },
];

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { addToast } = useToastStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<{lat: number, lng: number} | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<{ eta: number; distance: string; leg: "to_pickup" | "to_drop" } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOtherReason, setCancelOtherReason] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showChat, setShowChat] = useState<"rider" | "vendor" | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const statusRef = useRef(order?.status);

  const { unreadByOrder } = useUnreadMessages(currentUserId);
  const library = usePrintLibraryStore();
  const unreadCount = unreadByOrder[id] || 0;

  const cancelReasons = [
    "Changed my mind",
    "Found a better price",
    "Delivery time too long",
    "Wrong items ordered",
    "Restaurant unavailable",
    "Payment issue",
    "Other",
  ];

  const canCancel = order && ["pending", "accepted"].includes(order.status);

  useEffect(() => { statusRef.current = order?.status; }, [order?.status]);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleCancelOrder = async (reason?: string) => {
    try {
      const updates: Record<string, any> = { status: "cancelled" };
      if (reason) updates.cancel_reason = reason;
      const { error } = await supabase.from("orders").update(updates).eq("id", id).eq("user_id", currentUserId);
      if (error) throw error;
      setOrder((prev: any) => prev ? { ...prev, ...updates } : prev);
      addToast("Order cancelled successfully", "success");
    } catch (error) {
      console.error("Cancel error:", error);
      addToast("Failed to cancel order. Please try again.", "error");
    }
    setShowCancelReason(false);
    setCancelReason("");
    setCancelOtherReason("");
  };

  const handleCancelWithReason = () => {
    const finalReason = cancelReason === "Other" && cancelOtherReason.trim()
      ? cancelOtherReason.trim()
      : cancelReason;
    if (!finalReason) return;
    handleCancelOrder(finalReason);
  };

  const riderInfo = order?.riders ? {
    name: order.riders.name || "Rider",
    image: order.riders.profile_image || "https://ui-avatars.com/api/?name=Rider&background=0b50d5&color=fff",
    rating: order.riders.rating || 4.9,
    phone: order.riders.phone,
  } : {
    name: "Assigning Rider...",
    image: "https://ui-avatars.com/api/?name=Rider&background=0b50d5&color=fff",
    rating: 0,
  };

  useEffect(() => {
    const mounted = true;
    async function loadData() {
      try {
      setLoading(true);
      await new Promise(r => setTimeout(r, 500));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user && mounted) setCurrentUserId(user.id);
      
      const { data: basicOrder, error: fetchError } = await supabase
        .from("orders")
        .select("id, user_id, status")
        .eq("id", id)
        .maybeSingle();

      if (fetchError) {
        console.error("Order fetch error:", fetchError, "ID:", id);
        addToast("Failed to load order details. Please try again.", "error");
        if (!mounted) return;
        setOrder(null);
        setLoading(false);
        return;
      }

      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!mounted) return;
          setOrder(null);
          setLoading(false);
          return;
        }
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();
        
      if (orderError || !orderData) {
        if (!mounted) return;
        setOrder(null);
        setLoading(false);
        return;
      }

      const [vendorRes, riderRes, itemsRes, locationRes] = await Promise.all([
        orderData.vendor_id ? supabase.from("vendors").select("*").eq("id", orderData.vendor_id).single() : Promise.resolve({ data: null }),
        orderData.rider_id ? supabase.from("riders").select("*").eq("id", orderData.rider_id).single() : Promise.resolve({ data: null }),
        supabase.from("order_items").select("*").eq("order_id", id),
        supabase.from("rider_locations").select("lat, lng").eq("order_id", id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      const items = itemsRes.data || [];
      
      if (locationRes.data) {
        setRiderLocation({ lat: locationRes.data.lat, lng: locationRes.data.lng });
      }
      
      if (items.length > 0) {
        const menuItemIds = items.map((i: any) => i.menu_item_id).filter(Boolean);
        if (menuItemIds.length > 0) {
          const { data: menuItems } = await supabase.from("menu_items").select("*").in("id", menuItemIds);
          if (menuItems) {
            items.forEach((item: any) => {
              item.menu_item = menuItems.find(mi => mi.id === item.menu_item_id) || null;
            });
          }
        }
      }

      const fullOrder = {
        ...orderData,
        vendor: vendorRes.data,
        riders: riderRes.data,
        items: items
      };

      if (!mounted) return;
      setOrder(fullOrder);
    } catch (err) {
      console.error("Failed to load order:", err);
      if (!mounted) return;
      setOrder(null);
    }
    setLoading(false);
    }
    loadData();

    const channel = supabase
      .channel(`order-tracking-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${id}`,
      }, async (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          const newData = payload.new as any;
          const newStatus = newData.status;
          const oldStatus = statusRef.current;

          let riderData = null;
          if (newData.rider_id) {
            const { data } = await supabase.from("riders").select("*").eq("id", newData.rider_id).maybeSingle();
            riderData = data;
          }

          setOrder((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              ...newData,
              riders: riderData || prev?.riders,
            };
          });

          if (newStatus !== oldStatus && newStatus) {
            const statusMessages: Record<string, string> = {
              pending: "Order placed!",
              accepted: "🚴 Rider accepted your order!",
              processing: "🖨️ We're printing your documents!",
              preparing: "Restaurant is preparing your order",
              ready_for_pickup: "📦 Order is ready for rider pickup!",
              shopping: "Rider is shopping for your items",
              picking_up: "Rider is picking up your order",
              on_the_way: "🚴 Rider is on the way!",
              arrived: "📍 Rider has arrived!",
              delivered: "✅ Order delivered!",
              no_rider_available: "❌ No riders available — please try again",
            };
            const msg = statusMessages[newStatus];
            if (msg) addToast(msg, "info");

            // Fire browser notification for important statuses
            const notifyStatuses = ["accepted", "on_the_way", "arrived", "delivered"];
            if (notifyStatuses.includes(newStatus) && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification("MIIAM", {
                body: statusMessages[newStatus] || `Order status: ${newStatus}`,
                icon: "/icons/icon-192.svg",
                tag: `order-${id}`,
              });
            }
          }
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rider_locations',
        filter: `order_id=eq.${id}`,
      }, (payload: any) => {
        if (payload.new?.lat && payload.new?.lng) {
          setRiderLocation({ lat: payload.new.lat, lng: payload.new.lng });
        }
      })
      .subscribe((status) => {
        console.log("Order tracking channel status:", status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrder();
    }, 25000);
    return () => clearInterval(interval);
  }, [id]);

  const refreshOrder = async () => {
    setIsRefreshing(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      
      if (orderData) {
        const [vendorRes, riderRes, itemsRes, locationRes] = await Promise.all([
          orderData.vendor_id ? supabase.from("vendors").select("*").eq("id", orderData.vendor_id).single() : Promise.resolve({ data: null }),
          orderData.rider_id ? supabase.from("riders").select("*").eq("id", orderData.rider_id).single() : Promise.resolve({ data: null }),
          supabase.from("order_items").select("*").eq("order_id", id),
          supabase.from("rider_locations").select("lat, lng").eq("order_id", id).order('created_at', { ascending: false }).limit(1).maybeSingle()
        ]);
        const items = itemsRes.data || [];
        setOrder({ ...orderData, vendor: vendorRes.data, riders: riderRes.data, items });
        if (locationRes.data) setRiderLocation({ lat: locationRes.data.lat, lng: locationRes.data.lng });
      }
    } catch (err) {
      console.error("Failed to refresh order:", err);
    }
    setIsRefreshing(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!order) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface p-6">
      <span className="text-6xl mb-4">🔍</span>
      <h2 className="text-xl font-bold mb-2">Order not found</h2>
      <p className="text-on-surface-variant text-center mb-6">We couldn't find this order. It may have been removed or you may not have permission to view it.</p>
      <Link href="/app/orders" className="bg-primary text-white px-6 py-3 rounded-xl font-bold">
        {t.orders.viewAllOrders}
      </Link>
      <button onClick={() => window.location.reload()} className="mt-4 text-sm text-on-surface-variant">
        {t.orders.reloadPage}
      </button>
    </div>
  );

  const steps = order?.vendor_id === PRINTING_VENDOR_ID ? printSteps : foodSteps;
  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-3 sm:px-6 py-4 bg-white/90 backdrop-blur-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/app/orders" className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <span className="text-2xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => refreshOrder()} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-slate-200 transition-all" title="Refresh Order">
            <span className={`material-symbols-outlined text-on-surface ${isRefreshing ? "animate-spin" : ""}`}>refresh</span>
          </button>
          <Link href="/app/notifications" className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-slate-200 transition-all">
            <span className="material-symbols-outlined text-on-surface">notifications</span>
          </Link>
          <span className="material-symbols-outlined text-on-surface cursor-pointer hover:opacity-80 transition-opacity">account_circle</span>
        </div>
      </nav>
      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'My Orders', href: '/app/orders' }, { label: `Order #${id.slice(0, 8).toUpperCase()}` }]} />
      <div className="bg-gradient-to-b from-surface-container to-transparent h-2 mt-16" />

      <main className="pt-6 pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-10 items-start">
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {order?.vendor_id !== PRINTING_VENDOR_ID && (
            <div className="relative w-full h-[260px] sm:h-[420px] rounded-2xl overflow-hidden shadow-sm">

              {/* ETA Overlay */}
              {trackingInfo && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-4 py-3 shadow-lg flex items-center gap-2" style={{ zIndex: 10 }}>
                  <div className="text-center">
                    <p className="text-[10px] text-[#5c403d] font-bold uppercase tracking-wider">ETA</p>
                    <p className="text-xl font-black text-primary leading-none">{trackingInfo.eta} <span className="text-xs">MINS</span></p>
                    <p className="text-[10px] text-[#5c403d] font-medium">{trackingInfo.distance} km · {trackingInfo.leg === "to_pickup" ? "to pickup" : "to you"}</p>
                  </div>
                </div>
              )}

              <RiderMap
                dropoff={{
                  lat: 0, lng: 0,
                  label: order?.delivery_address || "",
                  kind: "home",
                }}
                pickup={order?.vendor?.address ? {
                  lat: 0, lng: 0,
                  label: order.vendor.address,
                  kind: "vendor",
                } : null}
                riderLocation={riderLocation}
                onRouteUpdate={setTrackingInfo}
              />
            </div>
            )}

            {order?.delay_minutes && order.delay_minutes > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-red-500 text-2xl mt-0.5">warning</span>
                <div>
                  <p className="font-bold text-red-800">Order is Delayed</p>
                  <p className="text-sm text-red-600">
                    {order.delay_reason
                      ? `${order.delay_reason} — approximately ${order.delay_minutes} min extra`
                      : `Approximately ${order.delay_minutes} min extra wait time`}
                  </p>
                </div>
              </div>
            )}

            {order?.estimated_prep_time && !order.delay_minutes && ["accepted", "preparing"].includes(order.status) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-500 text-2xl mt-0.5">timer</span>
                <div>
                  <p className="font-bold text-amber-800">{t.orders.preparingOrder}</p>
                  <p className="text-sm text-amber-600">
                    Estimated ready by{" "}
                    {(() => {
                      const t = new Date(new Date(order.placed_at).getTime() + order.estimated_prep_time * 60000);
                      return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    })()}
                  </p>
                </div>
              </div>
            )}

            {order.status !== "pending" && order.riders && (
              <div className="relative bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c4d0ff]/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex items-center gap-3 sm:gap-6 relative z-10 min-w-0">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                    <BlurImage src={riderInfo.image} alt={riderInfo.name} fill className="w-full h-full rounded-full overflow-hidden border-4 border-surface-container" sizes="80px" />
                    <div className="absolute bottom-0 right-0 bg-[#ffd709] text-[#453900] px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {riderInfo.rating}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold tracking-tight text-on-surface">{riderInfo.name}</h3>
                    <p className="text-on-surface-variant font-medium">Your delivery hero is on the move</p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setShowChat("rider")}
                        className="flex-1 bg-secondary text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all scale-95 active:scale-90 relative"
                      >
                        <span className="material-symbols-outlined text-lg">chat_bubble</span>
                        Chat
                        {unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </button>
                      <a
                        href={`tel:${riderInfo.phone || ''}`}
                        className="w-14 h-14 bg-surface-container text-secondary rounded-xl flex items-center justify-center hover:opacity-90 transition-all scale-95 active:scale-90"
                      >
                        <span className="material-symbols-outlined text-2xl">call</span>
                      </a>
                    </div>
                    {currentUserId && ["on_the_way", "arrived", "picking_up"].includes(order.status) && (
                      <div className="mt-3">
                        <ShareLocationToggle
                          orderId={id}
                          userId={currentUserId}
                          enabled
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Waiting for processing/acceptance */}
            {order.status === "pending" && order.vendor_id !== PRINTING_VENDOR_ID && (
              <div className="relative bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c4d0ff]/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex items-center gap-3 sm:gap-6 relative z-10 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full object-cover border-4 border-surface-container bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold tracking-tight text-on-surface">{t.orders.findingRider}</h3>
                    <p className="text-on-surface-variant font-medium">{t.orders.riderWillAccept}</p>
                    <p className="text-xs text-primary font-bold mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      Waiting for rider acceptance...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Printing order pending */}
            {order.status === "pending" && order.vendor_id === PRINTING_VENDOR_ID && (
              <div className="relative bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/40 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex items-center gap-3 sm:gap-6 relative z-10 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full object-cover border-4 border-surface-container bg-indigo-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>print</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold tracking-tight text-on-surface">Order Received</h3>
                    <p className="text-on-surface-variant font-medium">We're reviewing your print order</p>
                    <p className="text-xs text-indigo-600 font-bold mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                      Preparing your documents for printing...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-4 sm:space-y-6 mt-6 lg:mt-0">
            <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-8 shadow-sm">
                    <h2 className="text-xl font-extrabold tracking-tight mb-6 sm:mb-8 text-on-surface">{t.orders.orderJourney}</h2>
              <div className="space-y-0 relative">
                <div className="absolute left-[19px] top-4 bottom-10 w-0.5 bg-gradient-to-b from-primary via-primary to-outline" />

                {steps.map((step, index) => {
                  const isCompleted = currentStepIndex >= index;
                  const isCurrent = currentStepIndex === index;
                  const isPending = currentStepIndex < index;
                  
                  return (
                    <div key={step.key} className={`relative flex items-start gap-3 sm:gap-6 pb-6 sm:pb-8 min-w-0 ${isPending ? "opacity-40" : ""}`}>
                      <div className={`relative z-10 w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                        isCurrent 
                          ? "bg-primary text-white shadow-lg shadow-primary/20 ring-4 ring-primary-container/30" 
                          : isCompleted 
                            ? "bg-primary text-white shadow-md" 
                            : "bg-on-background text-outline"
                      }`}>
                        <span className={`material-symbols-outlined text-xl ${isCurrent ? "animate-pulse" : ""}`} style={{ fontVariationSettings: isCurrent || isCompleted ? "'FILL' 1" : "'FILL' 0" }}>
                          {isCompleted && !isCurrent ? "check" : step.icon}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-md font-bold ${isCurrent ? "text-primary" : isCompleted ? "text-on-surface" : "text-outline"}`}>
                          {step.label}
                        </h4>
                        <p className={`text-sm ${isCurrent ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>
                          {isCurrent ? (
                            step.key === "on_the_way" && trackingInfo
                              ? `${trackingInfo.distance} away · ${trackingInfo.eta} min ETA`
                              : step.key === "delivered"
                              ? "Order delivered successfully"
                              : step.key === "accepted"
                              ? "Rider is heading to pickup"
                              : step.key === "picking_up"
                              ? "Rider is picking up your order"
                              : step.key === "preparing"
                              ? "Restaurant is preparing your food"
                              : step.key === "processing"
                              ? "We're printing your documents"
                              : step.key === "shopping"
                              ? "Rider is shopping for your items"
                              : step.key === "ready_for_pickup"
                              ? "Your order is ready! Waiting for rider pickup"
                              : "In progress"
                          ) : isCompleted ? (
                            step.key === "pending" ? "Order placed successfully" :
                            step.key === "delivered" ? "Delivered" : "Completed"
                          ) : "Pending"}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-primary/60 font-bold mt-1 uppercase tracking-tighter">Current Step • {step.time}</p>
                        )}
                        {isCompleted && !isCurrent && (
                          <p className="text-xs text-outline font-medium mt-1">{step.time}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface-container rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm ${order.vendor_id === PRINTING_VENDOR_ID ? "text-indigo-600" : "text-primary"}`}>
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {order.vendor_id === PRINTING_VENDOR_ID ? "print" : "restaurant"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-on-surface">{order.vendor?.name || "Restaurant"}</h3>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat("vendor")}
                  className="text-secondary font-bold text-sm flex items-center gap-1 hover:underline"
                >
                  <span className="material-symbols-outlined text-base">chat_bubble</span>
                  Chat
                </button>
              </div>
              <div className="bg-white/50 rounded-2xl p-4 space-y-3">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">{item.quantity}x {item.menu_item?.name || "Item"}</span>
                    <span className="font-bold text-on-surface">₹{item.price?.toFixed(2) || "0.00"}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="text-on-surface font-bold">{t.orders.totalInclDelivery}</span>
                  <span className="text-lg font-black text-primary">₹{order.total_amount?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>

            {/* Print File Details */}
            {order.vendor_id === PRINTING_VENDOR_ID && order.items?.map((item: any, idx: number) => {
              let settings: Record<string, any> = {};
              try { if (item.special_notes) settings = JSON.parse(item.special_notes); } catch {}
              const fileUrls: string[] = settings.fileUrls || [];
              const fileNames: string[] = settings.fileNames || [];
              if (fileUrls.length === 0 && fileNames.length === 0) return null;
              const fileStatuses: boolean[] = settings.fileStatuses || [];
              const printedCount = fileStatuses.filter(Boolean).length;

              return (
                <div key={idx} className="bg-surface-container rounded-2xl p-4 sm:p-6 space-y-3">
                  <h3 className="font-extrabold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600">description</span>
                    Print Files
                    {fileStatuses.length > 0 && (
                      <span className="ml-auto text-xs font-bold text-on-surface-variant">
                        {printedCount}/{fileStatuses.length} printed
                      </span>
                    )}
                  </h3>
                  {printedCount > 0 && fileStatuses.length > 0 && (
                    <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${(printedCount / fileStatuses.length) * 100}%` }}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    {(fileNames.length > 0 ? fileNames : fileUrls).map((name: string, fi: number) => {
                      const isPrinted = fileStatuses[fi] === true;
                      return (
                        <div key={fi} className="flex items-center gap-3 bg-white/50 rounded-2xl p-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isPrinted ? "bg-emerald-100" : "bg-indigo-100"
                          }`}>
                            <span className={`material-symbols-outlined text-sm ${
                              isPrinted ? "text-emerald-600" : "text-indigo-600"
                            }`}>
                              {isPrinted ? "check_circle" : "description"}
                            </span>
                          </div>
                          <span className="text-sm text-on-surface truncate flex-1">{name}</span>
                          {fileStatuses.length > 0 && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                              isPrinted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {isPrinted ? "PRINTED" : "IN QUEUE"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {settings.pages && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">{settings.pages} pages</span>}
                    {settings.copies && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">{settings.copies} copies</span>}
                    {settings.colorMode && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold capitalize">{settings.colorMode === "bw" ? "B&W" : "Color"}</span>}
                    {settings.paperSize && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold uppercase">{settings.paperSize}</span>}
                    {settings.orientation && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold capitalize">{settings.orientation}</span>}
                    {settings.paperType && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold capitalize">{settings.paperType}</span>}
                    {settings.sides && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold capitalize">{settings.sides} sided</span>}
                    {settings.addOns && settings.addOns.length > 0 && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                        +{settings.addOns.length} add-on{settings.addOns.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {settings.rushTier && settings.rushTier !== "standard" && (
                      <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold">
                        ⚡ {settings.rushLabel || settings.rushTier}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Print Again */}
            {order.vendor_id === PRINTING_VENDOR_ID && order.status === "delivered" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    let added = 0;
                    order.items?.forEach((item: any) => {
                      let settings: Record<string, any> = {};
                      try { if (item.special_notes) settings = JSON.parse(item.special_notes); } catch {}
                      const fileUrls: string[] = settings.fileUrls || [];
                      const fileNames: string[] = settings.fileNames || [];
                      const before = library.files.length;
                      fileUrls.forEach((url, i) => {
                        library.addFile({ url, name: fileNames[i] || `print-${i + 1}.pdf`, size: 0, type: "application/pdf" });
                      });
                      added += Math.max(0, library.files.length - before);
                    });
                    addToast(added > 0 ? `Added ${added} file${added === 1 ? "" : "s"} to your library — one tap to re-print` : "Files already in your library", added > 0 ? "success" : "info");
                    router.push("/app/printing/library");
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 sm:py-5 text-base sm:text-lg font-extrabold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  {t.orders.printAgain}
                </button>
                <a
                  href={`/api/printing/invoice?orderId=${order.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl py-4 sm:py-5 text-base sm:text-lg font-extrabold hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">description</span>
                  {t.orders.gstInvoice}
                </a>
              </div>
            )}

                <button
                  onClick={() => setShowHelp(true)}
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
                    <button onClick={() => setShowHelp(false)} className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => router.push(`/app/orders/${id}/chat`)}
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
                        onClick={() => setShowCancelReason(true)}
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

            {/* Cancel Reason Modal */}
            {showCancelReason && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-on-surface">{t.orders.cancelOrder}</h2>
                    <button onClick={() => setShowCancelReason(false)} className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4">Please tell us why you&apos;re cancelling:</p>
                  <div className="space-y-2">
                    {cancelReasons.map((reason) => (
                      <div key={reason}>
                        <button
                          onClick={() => {
                            if (reason === "Other") {
                              setCancelReason(reason);
                            } else {
                              handleCancelOrder(reason);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl font-medium text-sm transition-all ${
                            cancelReason === reason
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-slate-50 text-slate-700 hover:bg-surface-container-high"
                          }`}
                        >
                          {reason}
                        </button>
                        {cancelReason === "Other" && reason === "Other" && (
                          <div className="mt-2 flex gap-2">
                            <input
                              type="text"
                              value={cancelOtherReason}
                              onChange={(e) => setCancelOtherReason(e.target.value)}
                              placeholder="Describe your reason..."
                              className="flex-1 bg-slate-50 border border-outline-variant/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                              autoFocus
                            />
                            <button
                              onClick={handleCancelWithReason}
                              disabled={!cancelOtherReason.trim()}
                              className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl text-sm disabled:opacity-50"
                            >
                              Submit
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowCancelReason(false)}
                    className="w-full mt-4 py-3 text-on-surface-variant font-bold text-sm"
                  >
                    {t.orders.keepOrder}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Overlay */}
        {showChat && currentUserId && (
          <OrderChatOverlay
            orderId={id}
            currentUserId={currentUserId}
            senderType="user"
            thread={showChat === "vendor" ? "user-vendor" : "user-rider"}
            otherName={showChat === "vendor" ? (order.vendor?.name || (order.vendor_id === PRINTING_VENDOR_ID ? "Print Store" : "Restaurant")) : (riderInfo?.name || "Rider")}
            otherAvatar={showChat === "vendor" ? order.vendor?.image_url || order.vendor?.logo_url || undefined : riderInfo?.image}
            onClose={() => setShowChat(null)}
          />
        )}
      </main>
    </div>
  );
}