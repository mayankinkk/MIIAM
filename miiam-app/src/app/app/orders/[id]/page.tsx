"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";

const steps = [
  { key: "pending", label: "Order Placed", icon: "receipt_long", time: "" },
  { key: "accepted", label: "Order Accepted", icon: "check_circle", time: "" },
  { key: "preparing", label: "Preparing", icon: "skillet", time: "" },
  { key: "shopping", label: "Shopping", icon: "shopping_cart", time: "" },
  { key: "picking_up", label: "Picking Up", icon: "storefront", time: "" },
  { key: "on_the_way", label: "On the Way", icon: "directions_bike", time: "" },
  { key: "delivered", label: "Delivered", icon: "home_pin", time: "" },
];

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToastStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [etaMins, setEtaMins] = useState(12);
  const [riderLocation, setRiderLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const canCancel = order && ["pending", "accepted"].includes(order.status);

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
      router.push("/app/orders");
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel order");
    }
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
      
      // Try to find the order by ID only
      const { data: basicOrder, error: fetchError } = await supabase
        .from("orders")
        .select("id, user_id, status")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Order fetch error:", fetchError, "ID:", id);
        setOrder(null);
        setLoading(false);
        return;
      }

      // Debug: Check if user is logged in
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session check:", session ? "has session" : "no session");
        if (!session) {
          setOrder(null);
          setLoading(false);
          return;
        }
      }

      const currentUserId = user?.id || (await supabase.auth.getSession()).data.session?.user.id;

      // Skip strict ownership check for now - just load if order exists
      console.log("Order owner:", basicOrder.user_id, "Current user:", currentUserId);

      // 3. Load full data (manual join due to missing foreign keys)
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

      // Fetch related data in parallel
      const [vendorRes, riderRes, itemsRes] = await Promise.all([
        orderData.vendor_id ? supabase.from("vendors").select("*").eq("id", orderData.vendor_id).single() : Promise.resolve({ data: null }),
        orderData.rider_id ? supabase.from("riders").select("*").eq("id", orderData.rider_id).single() : Promise.resolve({ data: null }),
        supabase.from("order_items").select("*").eq("order_id", id)
      ]);

      const items = itemsRes.data || [];
      
      // Fetch menu items for the order items
      if (items.length > 0) {
        const menuItemIds = items.map(i => i.menu_item_id).filter(Boolean);
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
          const oldStatus = order?.status;

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
              shopping: "Rider is shopping for your items",
              picking_up: "Rider is picking up your order",
              on_the_way: "🚴 Rider is on the way!",
              delivered: "✅ Order delivered!",
            };
            const msg = statusMessages[newStatus];
            if (msg) addToast(msg, "info");
          }
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rider_locations',
        filter: `order_id=eq.${id}`,
      }, (payload) => {
        setRiderLocation({ lat: payload.new.lat, lng: payload.new.lng });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, supabase]);

  useEffect(() => {
    if (!order || order.status !== "on_the_way") return;
    const interval = setInterval(() => setEtaMins((prev) => Math.max(1, prev - 1)), 60000);
    return () => clearInterval(interval);
  }, [order?.status]);

  if (loading) return (
    <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!order) return (
    <div className="min-h-screen bg-[#fff4f4] flex flex-col items-center justify-center text-[#4d212a] p-6">
      <span className="text-6xl mb-4">🔍</span>
      <h2 className="text-xl font-bold mb-2">Order not found</h2>
      <p className="text-[#814c55] text-center mb-6">We couldn't find this order. It may have been removed or you may not have permission to view it.</p>
      <Link href="/app/orders" className="bg-[#ba001c] text-white px-6 py-3 rounded-xl font-bold">
        View All Orders
      </Link>
      <button onClick={() => window.location.reload()} className="mt-4 text-sm text-slate-500">
        Reload page
      </button>
    </div>
  );

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/90 backdrop-blur-2xl shadow-[0px_10px_30px_rgba(77,33,42,0.04)]">
        <div className="flex items-center gap-4">
          <Link href="/app/orders" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#ffe1e4] hover:bg-[#ffcfd5] transition-all">
            <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
          </Link>
          <span className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="material-symbols-outlined text-[#4d212a] cursor-pointer hover:opacity-80 transition-opacity">notifications</span>
          <span className="material-symbols-outlined text-[#4d212a] cursor-pointer hover:opacity-80 transition-opacity">account_circle</span>
        </div>
      </nav>

      <div className="bg-gradient-to-b from-[#ffe1e4] to-transparent h-2 mt-16" />

      <main className="pt-6 pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:grid lg:grid-cols-12 lg:gap-10 items-start">
          <div className="lg:col-span-7 space-y-6">
            {/* Live Map - always visible */}
            <div className="relative w-full h-[420px] rounded-xl overflow-hidden shadow-[0px_20px_40px_rgba(77,33,42,0.06)]"
>
              <MainOrderMap
                orderId={id}
                riderLocation={riderLocation}
                deliveryAddress={order?.delivery_address}
              />
              {/* ETA chip */}
              <div className="absolute top-4 right-4 z-[400] backdrop-blur-xl bg-white/90 p-4 rounded-xl border border-white/20 shadow-xl flex flex-col items-center min-w-[120px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ba001c]/60 mb-1">ETA</span>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-extrabold text-[#ba001c] tracking-tighter">{etaMins}</span>
                  <span className="text-sm font-bold text-[#ba001c] mb-1">MINS</span>
                </div>
              </div>
            </div>

            {/* Rider Info - only show when rider assigned */}
            {order.status !== "pending" && order.riders && (
              <div className="relative bg-white rounded-xl p-6 shadow-[0px_20px_40px_rgba(77,33,42,0.04)] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c4d0ff]/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="relative">
                    <img className="w-20 h-20 rounded-full object-cover border-4 border-[#ffe1e4]" src={riderInfo.image} alt={riderInfo.name} />
                    <div className="absolute bottom-0 right-0 bg-[#ffd709] text-[#453900] px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {riderInfo.rating}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold tracking-tight text-[#4d212a]">{riderInfo.name}</h3>
                    <p className="text-[#814c55] font-medium">Your delivery hero is on the move</p>
                    <div className="flex gap-3 mt-4">
                      <Link 
                        href={`/app/orders/${id}/chat`}
                        className="flex-1 bg-[#0b50d5] text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all scale-95 active:scale-90"
                      >
                        <span className="material-symbols-outlined text-lg">chat_bubble</span>
                        Chat
                      </Link>
                      <a 
                        href={`tel:${riderInfo.phone || ''}`}
                        className="w-14 h-14 bg-[#ffe1e4] text-[#0b50d5] rounded-xl flex items-center justify-center hover:opacity-90 transition-all scale-95 active:scale-90"
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
                  <div className="w-20 h-20 rounded-full object-cover border-4 border-[#ffe1e4] bg-[#ffe1e4] flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-[#ba001c]" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold tracking-tight text-[#4d212a]">Finding a Rider</h3>
                    <p className="text-[#814c55] font-medium">A rider will accept your order soon</p>
                    <p className="text-xs text-[#ba001c] font-bold mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-[#ba001c] rounded-full animate-pulse" />
                      Waiting for rider acceptance...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6 mt-6 lg:mt-0">
            <div className="bg-white rounded-xl p-8 shadow-[0px_20px_40px_rgba(77,33,42,0.04)]">
              <h2 className="text-xl font-extrabold tracking-tight mb-8 text-[#4d212a]">Order Journey</h2>
              <div className="space-y-0 relative">
                <div className="absolute left-[19px] top-4 bottom-10 w-0.5 bg-gradient-to-b from-[#ba001c] via-[#ba001c] to-[#ffd9de]" />

                {steps.map((step, index) => {
                  const isCompleted = currentStepIndex >= index;
                  const isCurrent = currentStepIndex === index;
                  const isPending = currentStepIndex < index;
                  
                  return (
                    <div key={step.key} className={`relative flex items-start gap-6 pb-8 ${isPending ? "opacity-40" : ""}`}>
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                        isCurrent 
                          ? "bg-[#ba001c] text-white shadow-lg shadow-[#ba001c]/20 ring-4 ring-[#ff7670]/30" 
                          : isCompleted 
                            ? "bg-[#ba001c] text-white shadow-md" 
                            : "bg-[#ffd9de] text-[#a06770]"
                      }`}>
                        <span className={`material-symbols-outlined text-xl ${isCurrent ? "animate-pulse" : ""}`} style={{ fontVariationSettings: isCurrent || isCompleted ? "'FILL' 1" : "'FILL' 0" }}>
                          {isCompleted && !isCurrent ? "check" : step.icon}
                        </span>
                      </div>
                      <div>
                        <h4 className={`text-md font-bold ${isCurrent ? "text-[#ba001c]" : isCompleted ? "text-[#4d212a]" : "text-[#a06770]"}`}>
                          {step.label}
                        </h4>
                        <p className={`text-sm ${isCurrent ? "text-[#4d212a] font-medium" : "text-[#814c55]"}`}>
                          {isCurrent ? `Marco is currently in traffic near your street` : 
                           isCompleted ? `Step completed` : "Pending delivery"}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-[#ba001c]/60 font-bold mt-1 uppercase tracking-tighter">Current Step • {step.time}</p>
                        )}
                        {isCompleted && !isCurrent && (
                          <p className="text-xs text-[#a06770] font-medium mt-1">{step.time}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#ffe1e4] rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#ba001c] shadow-sm">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#4d212a]">{order.vendor?.name || "Restaurant"}</h3>
                    <p className="text-xs font-bold text-[#ba001c] uppercase tracking-widest">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <Link href={`/app/orders/${id}`} className="text-[#0b50d5] font-bold text-sm hover:underline">View Details</Link>
              </div>
              <div className="bg-white/50 rounded-xl p-4 space-y-3">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-[#814c55] font-medium">{item.quantity}x {item.menu_item?.name || "Item"}</span>
                    <span className="font-bold text-[#4d212a]">₹{item.price?.toFixed(2) || "0.00"}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-[#dd9ca6]/20 flex justify-between items-center">
                  <span className="text-[#4d212a] font-bold">Total (incl. Delivery)</span>
                  <span className="text-lg font-black text-[#ba001c]">₹{order.total_amount?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowHelp(true)}
              className="w-full bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white rounded-xl py-5 text-lg font-extrabold shadow-lg shadow-[#ba001c]/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {canCancel ? "Cancel Order" : "Help with Order"}
            </button>

            {!canCancel && order && order.status !== "delivered" && order.status !== "cancelled" && (
              <p className="text-center text-sm text-slate-500 mt-2">
                Contact rider or customer support to make changes
              </p>
            )}

            {showHelp && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                        onClick={handleCancelOrder}
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
          </div>
        </div>
      </main>
    </div>
  );
}

function MainOrderMap({ orderId, riderLocation, deliveryAddress }: {
  orderId: string;
  riderLocation: { lat: number; lng: number } | null;
  deliveryAddress?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const supabase = createClient();

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
        attribution: '\u00a9 OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);
      mapInstanceRef.current = map;

      // Geocode delivery address to place home pin
      if (deliveryAddress) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(deliveryAddress)}&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data[0] && isMounted) {
            centerLat = parseFloat(data[0].lat);
            centerLng = parseFloat(data[0].lon);
            const homeIcon = L.divIcon({
              className: '',
              html: `<div style="background:#ba001c;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(186,0,28,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;">\ud83c\udfe0</div>`,
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            });
            L.marker([centerLat, centerLng], { icon: homeIcon })
              .bindPopup('Your delivery location')
              .addTo(map);
            map.setView([centerLat, centerLng], 15);
          }
        } catch (_) {
          // Geocoding failed — use default center
        }
      }

      // Place rider marker if we already have a location
      if (riderLocation && isMounted) {
        const riderIcon = L.divIcon({
          className: '',
          html: `<div style="background:#0b50d5;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(11,80,213,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;">\ud83d\udee5</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        riderMarkerRef.current = L.marker([riderLocation.lat, riderLocation.lng], { icon: riderIcon })
          .bindPopup('Rider')
          .addTo(map);
      }
    }

    initMap();

    // Subscribe to live rider location updates
    const channel = supabase
      .channel(`main-map-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rider_locations',
        filter: `order_id=eq.${orderId}`,
      }, async (payload: any) => {
        if (payload.new?.lat && payload.new?.lng) {
          const { lat, lng } = payload.new;
          if (riderMarkerRef.current) {
            riderMarkerRef.current.setLatLng([lat, lng]);
          } else if (mapInstanceRef.current) {
            const L = await import('leaflet');
            const riderIcon = L.divIcon({
              className: '',
              html: `<div style="background:#0b50d5;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(11,80,213,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;">\ud83d\udee5</div>`,
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            });
            riderMarkerRef.current = L.marker([lat, lng], { icon: riderIcon })
              .bindPopup('Rider')
              .addTo(mapInstanceRef.current);
          }
          mapInstanceRef.current?.setView([lat, lng], 15, { animate: true });
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [orderId, deliveryAddress]);

  // Sync rider location prop changes to marker
  useEffect(() => {
    if (riderLocation && riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([riderLocation.lat, riderLocation.lng]);
    }
  }, [riderLocation]);

  return <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />;
}