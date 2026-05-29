"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import BlurImage from "@/components/BlurImage";
import OrderChatOverlay from "@/components/order/OrderChatOverlay";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";

const steps = [
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

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToastStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<{lat: number, lng: number} | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<{ eta: number; distance: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOtherReason, setCancelOtherReason] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showChat, setShowChat] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const statusRef = useRef(order?.status);

  const { unreadByOrder } = useUnreadMessages(currentUserId);
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
      const { error } = await supabase.from("orders").update(updates).eq("id", id);
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
    async function loadData() {
      setLoading(true);
      await new Promise(r => setTimeout(r, 500));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      
      const { data: basicOrder, error: fetchError } = await supabase
        .from("orders")
        .select("id, user_id, status")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Order fetch error:", fetchError, "ID:", id);
        addToast("Failed to load order details. Please try again.", "error");
        setOrder(null);
        setLoading(false);
        return;
      }

      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setOrder(null);
          setLoading(false);
          return;
        }
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
        
      if (orderError || !orderData) {
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

      setOrder(fullOrder);
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
            const { data } = await supabase.from("riders").select("*").eq("id", newData.rider_id).single();
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
              preparing: "Restaurant is preparing your order",
              ready_for_pickup: "📦 Order is ready for pickup!",
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
        View All Orders
      </Link>
      <button onClick={() => window.location.reload()} className="mt-4 text-sm text-slate-500">
        Reload page
      </button>
    </div>
  );

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-surface">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/90 backdrop-blur-2xl shadow-[0px_10px_30px_rgba(77,33,42,0.04)]">
        <div className="flex items-center gap-4">
          <Link href="/app/orders" className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <span className="text-2xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => refreshOrder()} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-all" title="Refresh Order">
            <span className={`material-symbols-outlined text-on-surface ${isRefreshing ? "animate-spin" : ""}`}>refresh</span>
          </button>
          <span className="material-symbols-outlined text-on-surface cursor-pointer hover:opacity-80 transition-opacity">notifications</span>
          <span className="material-symbols-outlined text-on-surface cursor-pointer hover:opacity-80 transition-opacity">account_circle</span>
        </div>
      </nav>
      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'My Orders', href: '/app/orders' }, { label: `Order #${id.slice(0, 8).toUpperCase()}` }]} />
      <div className="bg-gradient-to-b from-surface-container to-transparent h-2 mt-16" />

      <main className="pt-6 pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:grid lg:grid-cols-12 lg:gap-10 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="relative w-full h-[420px] rounded-xl overflow-hidden shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
              
              {/* ETA Overlay */}
              {trackingInfo && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-4 py-3 shadow-lg flex items-center gap-2" style={{ zIndex: 10 }}>
                  <div className="text-center">
                    <p className="text-[10px] text-[#5c403d] font-bold uppercase tracking-wider">ETA</p>
                    <p className="text-xl font-black text-primary leading-none">{trackingInfo.eta} <span className="text-xs">MINS</span></p>
                  </div>
                </div>
              )}

              <MainOrderMap
                orderId={id}
                riderLocation={riderLocation}
                deliveryAddress={order?.delivery_address}
                onRouteUpdate={setTrackingInfo}
              />
            </div>

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
                  <p className="font-bold text-amber-800">Preparing Your Order</p>
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
              <div className="relative bg-white rounded-xl p-6 shadow-[0px_20px_40px_rgba(77,33,42,0.04)] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c4d0ff]/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="relative w-20 h-20">
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
                        onClick={() => setShowChat(true)}
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
                  </div>
                </div>
              </div>
            )}

            {/* Waiting for rider - shown before acceptance */}
            {order.status === "pending" && (
              <div className="relative bg-white rounded-xl p-6 shadow-[0px_20px_40px_rgba(77,33,42,0.04)] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c4d0ff]/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-full object-cover border-4 border-surface-container bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold tracking-tight text-on-surface">Finding a Rider</h3>
                    <p className="text-on-surface-variant font-medium">A rider will accept your order soon</p>
                    <p className="text-xs text-primary font-bold mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      Waiting for rider acceptance...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6 mt-6 lg:mt-0">
            <div className="bg-white rounded-xl p-8 shadow-[0px_20px_40px_rgba(77,33,42,0.04)]">
              <h2 className="text-xl font-extrabold tracking-tight mb-8 text-on-surface">Order Journey</h2>
              <div className="space-y-0 relative">
                <div className="absolute left-[19px] top-4 bottom-10 w-0.5 bg-gradient-to-b from-primary via-primary to-outline" />

                {steps.map((step, index) => {
                  const isCompleted = currentStepIndex >= index;
                  const isCurrent = currentStepIndex === index;
                  const isPending = currentStepIndex < index;
                  
                  return (
                    <div key={step.key} className={`relative flex items-start gap-6 pb-8 ${isPending ? "opacity-40" : ""}`}>
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
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
                      <div>
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

            <div className="bg-surface-container rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-on-surface">{order.vendor?.name || "Restaurant"}</h3>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <Link href={`/app/orders/${id}`} className="text-secondary font-bold text-sm hover:underline">View Details</Link>
              </div>
              <div className="bg-white/50 rounded-xl p-4 space-y-3">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">{item.quantity}x {item.menu_item?.name || "Item"}</span>
                    <span className="font-bold text-on-surface">₹{item.price?.toFixed(2) || "0.00"}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                  <span className="text-on-surface font-bold">Total (incl. Delivery)</span>
                  <span className="text-lg font-black text-primary">₹{order.total_amount?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowHelp(true)}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-white rounded-xl py-5 text-lg font-extrabold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {canCancel ? "Cancel Order" : "Help with Order"}
            </button>

            {/* Show cancelled state prominently */}
            {order.status === "cancelled" && (
              <div className="w-full bg-red-50 border border-red-200 rounded-xl py-4 text-center">
                <span className="material-symbols-outlined text-red-500 text-3xl block mb-1">cancel</span>
                <p className="text-red-600 font-bold">Order Cancelled</p>
                <p className="text-sm text-red-400 mt-1">This order has been cancelled</p>
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
              <p className="text-center text-sm text-slate-500 mt-2">
                Contact rider or customer support to make changes
              </p>
            )}

            {showHelp && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-slate-800">Need Help?</h2>
                    <button onClick={() => setShowHelp(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => router.push(`/app/orders/${id}/chat`)}
                      className="w-full p-4 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">chat</span>
                      Chat with Rider
                    </button>
                    
                    {order?.riders?.phone ? (
                      <a 
                        href={`tel:${order.riders.phone}`}
                        className="w-full p-4 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">call</span>
                        Call Rider
                      </a>
                    ) : (
                      <a 
                        href="tel:+919876543210"
                        className="w-full p-4 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">call</span>
                        Call Support
                      </a>
                    )}
                    
                    {canCancel && (
                      <button 
                        onClick={() => setShowCancelReason(true)}
                        className="w-full p-4 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">cancel</span>
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Cancel Reason Modal */}
            {showCancelReason && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-slate-800">Cancel Order</h2>
                    <button onClick={() => setShowCancelReason(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Please tell us why you&apos;re cancelling:</p>
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
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
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
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
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
                    className="w-full mt-4 py-3 text-slate-500 font-bold text-sm"
                  >
                    Keep Order
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
            otherName={riderInfo?.name || "Rider"}
            onClose={() => setShowChat(false)}
          />
        )}
      </main>
    </div>
  );
}

function MainOrderMap({ orderId, riderLocation, deliveryAddress, onRouteUpdate }: {
  orderId: string;
  riderLocation: { lat: number; lng: number } | null;
  deliveryAddress?: string;
  onRouteUpdate?: (info: { eta: number; distance: string }) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const destLatLngRef = useRef<[number, number] | null>(null);
  const routeLayerRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;
    let isMounted = true;

    async function initMap() {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (!isMounted || !mapRef.current) return;

      // Default: New Delhi
      let centerLat = 28.6139;
      let centerLng = 77.2090;

      const map = L.map(mapRef.current, { zoomControl: false }).setView([centerLat, centerLng], 14);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);
      mapInstanceRef.current = map;

      const homeIcon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:44px;height:44px">
          <div style="position:absolute;inset:0;background:rgba(186,0,28,0.15);border-radius:50%;animation:pulse-ring 1.4s ease-out infinite"></div>
          <div style="position:absolute;inset:4px;background:var(--color-primary);border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;">🏠</div>
        </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });

      // Geocode delivery address to place home pin
      if (deliveryAddress) {
        try {
          // Add India fallback for better search accuracy
          const searchAddress = deliveryAddress.toLowerCase().includes('india') ? deliveryAddress : `${deliveryAddress}, India`;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data[0] && isMounted) {
            const dLat = parseFloat(data[0].lat);
            const dLng = parseFloat(data[0].lon);
            destLatLngRef.current = [dLat, dLng];
            L.marker([dLat, dLng], { icon: homeIcon })
              .bindPopup('Your delivery location')
              .addTo(map);
            map.setView([dLat, dLng], 15);
          }
        } catch (_) {
          // Geocoding failed
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [deliveryAddress]);

  // Sync rider location prop changes to marker and draw route
  useEffect(() => {
    if (!riderLocation || !mapInstanceRef.current) return;
    let isMounted = true;

    async function updateRider() {
      const L = await import('leaflet');
      const map = mapInstanceRef.current;
      const { lat, lng } = riderLocation!;
      
      if (!riderMarkerRef.current) {
        const riderIcon = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:46px;height:46px">
            <div style="position:absolute;inset:0;background:rgba(11,80,213,0.2);border-radius:50%;animation:pulse-ring 1s ease-out infinite"></div>
            <div style="position:absolute;inset:4px;background:var(--color-secondary);border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:20px;">🛵</div>
          </div>`,
          iconSize: [46, 46],
          iconAnchor: [23, 46],
        });
        riderMarkerRef.current = L.marker([lat, lng], { icon: riderIcon, zIndexOffset: 1000 })
          .bindPopup('Rider')
          .addTo(map);
      } else {
        riderMarkerRef.current.setLatLng([lat, lng]);
      }

      const dest = destLatLngRef.current;
      if (dest) {
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${dest[1]},${dest[0]}?overview=full&geometries=geojson`
          );
          const data = await res.json();
          if (data.routes?.[0] && isMounted && mapInstanceRef.current) {
            routeLayerRef.current.forEach(l => map.removeLayer(l));
            routeLayerRef.current = [];
            const coords = data.routes[0].geometry.coordinates.map((c: [number,number]) => [c[1], c[0]]);
            const shadow = L.polyline(coords, { color: `rgba(186,0,28,0.2)`, weight: 10, lineCap: 'round' }).addTo(map);
            const line = L.polyline(coords, { color: 'var(--color-primary)', weight: 5, lineCap: 'round' }).addTo(map);
            routeLayerRef.current = [shadow, line];
            
            const eta = Math.round(data.routes[0].duration / 60);
            const distance = (data.routes[0].distance / 1000).toFixed(1);
            if (onRouteUpdate) onRouteUpdate({ eta, distance });
            
            map.fitBounds([[lat, lng], [dest[0], dest[1]]], { padding: [40, 40] });
          }
        } catch (_) {}
      } else {
        map.setView([lat, lng], 15, { animate: true });
      }
    }

    updateRider();

    return () => { isMounted = false; };
  }, [riderLocation]);

  return (
    <div className="relative w-full h-full">
      <style>{`
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
      `}</style>
      {/* LIVE badge */}
      <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        LIVE
      </div>
      <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />
    </div>
  );
}