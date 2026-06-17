"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PullToRefresh from "@/components/PullToRefresh";
import { startLocationTracking, stopLocationTracking } from "@/lib/rider-location-tracker";
import { calculateEarnings } from "@/lib/earnings";

interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  special_notes: string | null;
  status: "pending" | "available" | "unavailable" | "different_brand";
  picked: boolean;
  actual_price: number | null;
  menu_item?: {
    name: string;
    category: string;
  };
}

interface Order {
  id: string;
  user_id?: string;
  rider_id?: string;
  vendor_id?: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  special_instructions: string | null;
  placed_at: string;
  delivered_at?: string;
  customer_collected?: number;
  customer_name?: string;
  customer_phone?: string;
  vendor?: {
    name: string;
    address: string;
    phone: string;
    lat?: number;
    lng?: number;
  };
  address?: {
    street: string;
    city: string;
  };
  items?: OrderItem[];
}

export default function RiderOrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"available" | "shopping" | "completed" | "history">("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month">("today");
  const [sortBy, setSortBy] = useState<"newest" | "earnings_high" | "distance">("newest");
  const [showAutoSkip, setShowAutoSkip] = useState(false);
  const [autoSkipTime, setAutoSkipTime] = useState(30);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showCashCollectModal, setShowCashCollectModal] = useState(false);
  const [cashToCollect, setCashToCollect] = useState(0);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [riderLocation, setRiderLocation] = useState({ lat: 28.6139, lng: 77.2090 });
  const [error, setError] = useState<string | null>(null);
  const [riderProfile, setRiderProfile] = useState<{ id: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  function showToast(message: string, type: "success" | "error" | "info" = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadOrders(riderId?: string) {
    setLoading(true);
    setError(null);
    try {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      // Fetch available orders (not assigned to any rider)
      const { data: availableOrders, error: dbError } = await supabase
        .from("orders")
        .select("*")
        .is("rider_id", null)
        .in("status", ["ready_for_pickup"])
        .gte("placed_at", yesterday.toISOString())
        .order("placed_at", { ascending: false });

      if (dbError) throw new Error(dbError.message);

      // Also fetch this rider's own accepted orders
      const { data: myOrders } = riderId ? await supabase
        .from("orders")
        .select("*")
        .eq("rider_id", riderId)
        .in("status", ["ready_for_pickup", "on_the_way"])
        .order("placed_at", { ascending: false }) : { data: [] };

      const allDbOrders = [...(availableOrders || []), ...(myOrders || [])];
      // Deduplicate by id
      const seen = new Set<string>();
      const uniqueOrders = allDbOrders.filter(o => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });

      if (uniqueOrders.length > 0) {
        const vendorIds = [...new Set(uniqueOrders.map(o => o.vendor_id).filter(Boolean))] as string[];
        const addressIds = [...new Set(uniqueOrders.map(o => o.delivery_address_id).filter(Boolean))] as string[];
        const userIds = [...new Set(uniqueOrders.map(o => o.user_id).filter(Boolean))] as string[];
        const orderIds = uniqueOrders.map(o => o.id);

        const [vendorsRes, addressesRes, allItemsRes, profilesRes] = await Promise.all([
          vendorIds.length > 0 ? supabase.from("vendors").select("*").in("id", vendorIds) : Promise.resolve({ data: [] }),
          addressIds.length > 0 ? supabase.from("delivery_addresses").select("*").in("id", addressIds) : Promise.resolve({ data: [] }),
          supabase.from("order_items").select("*").in("order_id", orderIds),
          userIds.length > 0 ? supabase.from("profiles").select("id, full_name").in("id", userIds) : Promise.resolve({ data: [] }),
        ]);

        const vendorsMap = new Map((vendorsRes.data || []).map((v: any) => [v.id, v]));
        const addressesMap = new Map((addressesRes.data || []).map((a: any) => [a.id, a]));
        const profilesMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
        const allItems = allItemsRes.data || [];

        const allMenuItemIds = [...new Set(allItems.map((i: OrderItem) => i.menu_item_id).filter(Boolean))] as string[];
        let menuItemsMap = new Map();
        if (allMenuItemIds.length > 0) {
          const { data: menuItems } = await supabase.from("menu_items").select("id, name, category").in("id", allMenuItemIds);
          menuItemsMap = new Map((menuItems || []).map((mi: any) => [mi.id, mi]));
        }

        const fullOrders = uniqueOrders.map(order => {
          const items = (allItems.filter((i: OrderItem) => i.order_id === order.id)).map((item: OrderItem) => ({
            ...item,
            menu_item: item.menu_item_id ? menuItemsMap.get(item.menu_item_id) || null : null,
          }));
          return {
            ...order,
            vendor: order.vendor_id ? vendorsMap.get(order.vendor_id) || null : null,
            address: order.delivery_address_id ? addressesMap.get(order.delivery_address_id) || null : null,
            items,
            customer_name: order.user_id ? (profilesMap.get(order.user_id) as any)?.full_name || "Customer" : "Customer",
          };
        });
        setOrders(fullOrders);
      } else {
        setOrders([]);
      }
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
      setLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string; email?: string } | null } }) => {
      if (!user) return;
      supabase.from("riders").select("id").eq("user_id", user.id).single().then(({ data }: { data: { id: string } | null }) => {
        if (data) {
          setRiderProfile(data);
          loadOrders(data.id);
        } else {
          loadOrders();
        }
      });
    });

    // Use real GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRiderLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          console.log("GPS unavailable, using default location");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    const channel = supabase
      .channel('rider-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      }, (payload: { new: Record<string, unknown> }) => {
        const newOrder = payload.new as { id?: string; status: string; total_amount: number };
        if (newOrder.status === 'ready_for_pickup') {
          setOrders(prev => [newOrder as Order, ...prev]);
          if (Notification.permission === 'granted') {
            new Notification('New Order Available!', {
              body: `Order #${newOrder.id?.slice(0,8)} - ₹${newOrder.total_amount}`,
              icon: '/icon.png',
            });
          } else if (Notification.permission === 'default') {
            Notification.requestPermission();
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
      }, (payload: { new: Record<string, unknown> }) => {
        const updatedOrder = payload.new as { id: string; status: string };
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'orders',
      }, (payload: { old: Record<string, unknown> }) => {
        const deletedOrder = payload.old as { id: string };
        setOrders(prev => prev.filter(o => o.id !== deletedOrder.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function acceptOrder(orderId: string) {
    try {
      if (!riderProfile) {
        showToast("Rider profile not loaded. Please wait.", "error");
        return;
      }

      let accepted = false;

      // Try atomic RPC first
      try {
        const { data: success, error } = await supabase.rpc('accept_order_as_rider', {
          p_order_id: orderId,
          p_rider_id: riderProfile.id,
        });
        if (success && !error) accepted = true;
      } catch {
        console.log("RPC not available, using fallback");
      }

      // Fallback: direct update — just assign rider to ready_for_pickup order
      if (!accepted) {
        const { error } = await supabase
          .from("orders")
          .update({
            rider_id: riderProfile.id,
            accepted_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .is("rider_id", null);

        if (error) {
          showToast("Order was already accepted by another rider.", "error");
          return;
        }
      }

      const order = orders.find(o => o.id === orderId);
      if (order?.user_id) {
        try {
          await supabase.from("notifications").insert({
            user_id: order.user_id,
            title: "Rider Assigned!",
            message: "A rider is on their way to pick up your order.",
            type: "order",
            read: false,
          });
        } catch (notifErr) {
          console.log("Notification error (non-critical):", notifErr);
        }
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, rider_id: riderProfile.id } : o));
      showToast("Order accepted!", "success");
    } catch (err: any) {
      console.error("Error accepting order:", err);
      showToast("Failed to accept order: " + (err?.message || "Unknown error"), "error");
    }
  }

  async function batchAccept() {
    if (selectedOrders.length === 0) return;
    if (!riderProfile) {
      showToast("Rider profile not loaded. Please wait.", "error");
      return;
    }

    try {
      let failedCount = 0;
      for (const orderId of selectedOrders) {
        let accepted = false;
        try {
          const { data: success, error } = await supabase.rpc('accept_order_as_rider', {
            p_order_id: orderId,
            p_rider_id: riderProfile.id,
          });
          if (success && !error) accepted = true;
        } catch {
          console.log("RPC not available, using fallback");
        }

        if (!accepted) {
          const { error } = await supabase
            .from("orders")
            .update({
              rider_id: riderProfile.id,
              accepted_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .is("rider_id", null);

          if (error) {
            failedCount++;
            continue;
          }
        }

        const order = orders.find(o => o.id === orderId);
        if (order?.user_id) {
          try {
            await supabase.from("notifications").insert({
              user_id: order.user_id,
              title: "Rider Assigned!",
              message: "A rider is on their way to pick up your order.",
              type: "order",
              read: false,
            });
          } catch (e) { console.warn("Failed to insert notification:", e); }
        }
      }
      
      const successCount = selectedOrders.length - failedCount;
      setOrders(prev => prev.map(o => selectedOrders.includes(o.id) ? { ...o, rider_id: riderProfile.id } : o));
      showToast(`${successCount} order(s) accepted!${failedCount > 0 ? ` ${failedCount} already taken.` : ''}`, "success");
      setSelectedOrders([]);
    } catch (err) {
      console.error("Error batch accepting:", err);
      showToast("Failed to accept orders", "error");
    }
  }

  function toggleSelectOrder(orderId: string) {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  }

  async function updateItemStatus(orderId: string, itemId: string, status: string, actualPrice?: number) {
    try {
      // Update database
      const { error } = await supabase
        .from("order_items")
        .update({ 
          status: status,
          actual_price: actualPrice ?? null,
          picked: status === "available"
        })
        .eq("id", itemId);
      
      if (error) {
        console.error("Error updating item:", error);
        showToast("Failed to update item: " + error.message, "error");
        return;
      }
    } catch (err) {
      console.error("Update error:", err);
    }
    
    // Update local state
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items?.map(i => i.id === itemId ? { ...i, status: status as any, actual_price: actualPrice ?? i.actual_price } : i)
        };
      }
      return o;
    }));
  }

  async function markDelivered(orderId: string) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const totalSpent = order.items?.reduce((sum, item) => sum + (item.actual_price || 0) * item.quantity, 0) || 0;
      setCurrentOrderId(orderId);
      setCashToCollect(order.total_amount - totalSpent + (order.delivery_fee || 0));
      setShowCashCollectModal(true);
    }
  }

  async function confirmDelivery() {
    try {
      if (!currentOrderId) return;
      const order = orders.find(o => o.id === currentOrderId);
      if (!order) return;
      const riderEarning = calculateEarnings(0);

      // 1. Credit wallet first (non-critical — can be compensated)
      if (order.rider_id) {
        try {
          const { data: wallet } = await supabase
            .from("rider_wallets")
            .select("id, balance, total_earnings")
            .eq("rider_id", order.rider_id)
            .maybeSingle();
          if (wallet) {
            await supabase
              .from("rider_wallets")
              .update({
                balance: (wallet.balance || 0) + riderEarning,
                total_earnings: (wallet.total_earnings || 0) + riderEarning,
              })
              .eq("id", wallet.id);
          } else {
            await supabase
              .from("rider_wallets")
              .insert({
                rider_id: order.rider_id,
                balance: riderEarning,
                total_earnings: riderEarning,
                pending_payout: 0,
                advance_used: 0,
              });
          }
          // Log transaction
          await supabase
            .from("rider_wallet")
            .insert({
              rider_id: order.rider_id,
              amount: riderEarning,
              type: "earning",
              description: `Delivery earnings for order #${currentOrderId.slice(0, 8)}`,
              order_id: currentOrderId,
              created_at: new Date().toISOString(),
            });
        } catch (walletErr) {
          console.error("Wallet credit failed (non-critical):", walletErr);
        }

        // Update rider delivery count
        try {
          const { data: rider } = await supabase
            .from("riders")
            .select("total_deliveries")
            .eq("id", order.rider_id)
            .single();
          await supabase
            .from("riders")
            .update({ total_deliveries: (rider?.total_deliveries || 0) + 1 })
            .eq("id", order.rider_id);
        } catch { /* column may not exist */ }
      }

      // 2. Send notifications (non-critical)
      if (order.user_id) {
        try {
          await supabase.from("notifications").insert({
            user_id: order.user_id,
            title: "Order Delivered!",
            message: "Your order has been delivered. Enjoy your food!",
            type: "order",
            read: false,
          });
        } catch { /* table or column may not exist */ }
        try {
          await fetch("/api/emails/order-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: currentOrderId, status: "delivered" }),
          });
        } catch (emailErr) {
          console.warn("Failed to send delivery email:", emailErr);
        }
      }

      // 3. Order status update LAST (critical — point of no return)
      const { error: orderErr } = await supabase
        .from("orders")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
          rider_earning: riderEarning,
          customer_collected: cashToCollect,
        })
        .eq("id", currentOrderId);
      if (orderErr) throw new Error("order update: " + orderErr.message);

      setOrders(prev => prev.map(o => o.id === currentOrderId ? { ...o, status: "delivered", delivered_at: new Date().toISOString(), customer_collected: cashToCollect } : o));
      setShowCashCollectModal(false);
      showToast(`Delivery complete! You earned ₹${riderEarning}!`, "success");
    } catch (err) {
      console.error("Error delivering order:", err);
      showToast("Failed to complete delivery.", "error");
    }
  }

  async function startDelivery(orderId: string) {
    try {
      if (!riderProfile) return;

      await supabase
        .from("orders")
        .update({ status: "on_the_way" })
        .eq("id", orderId);

      const order = orders.find(o => o.id === orderId);
      if (order?.user_id) {
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          title: "Order On The Way! 🚴",
          message: "Your rider has picked up your order and is heading to you. Track in real-time!",
          type: "order",
          read: false,
          created_at: new Date().toISOString(),
        });

        try {
          await fetch("/api/emails/order-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, status: "on_the_way" }),
          });
        } catch (emailErr) {
          console.warn("Failed to send status email:", emailErr);
        }

        // Browser notification
        if (typeof window !== "undefined" && Notification.permission === "granted") {
          new Notification("Order On The Way! 🚴", {
            body: "Your rider has picked up your order and is heading to you",
            icon: "/icon.png",
          });
        }

        await supabase.from("rider_locations").insert({
          order_id: orderId,
          rider_id: riderProfile.id,
          rider_name: '',
          rider_phone: '',
          lat: riderLocation.lat,
          lng: riderLocation.lng,
        });
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "on_the_way" } : o));
    } catch (err) {
      console.error("Error starting delivery:", err);
    }
  }

  async function updateRiderLocation(orderId: string) {
    if (!navigator.geolocation || !riderProfile) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      await supabase.from("rider_locations").insert({
        order_id: orderId,
        rider_id: riderProfile.id,
        rider_name: '',
        rider_phone: '',
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  }

  const filteredOrders = orders.filter(o => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return o.id.toLowerCase().includes(search) ||
             o.vendor?.name?.toLowerCase().includes(search) ||
             o.address?.street?.toLowerCase().includes(search);
    }
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "earnings_high": return ((b.total_amount || 0) + (b.delivery_fee || 0)) - ((a.total_amount || 0) + (a.delivery_fee || 0));
      case "distance": return 0;
      default: return new Date(b.placed_at || 0).getTime() - new Date(a.placed_at || 0).getTime();
    }
  });

  const availableOrders = filteredOrders.filter(o => o.status === "ready_for_pickup" && !o.rider_id);
  const shoppingOrders = filteredOrders.filter(o => o.rider_id && ["ready_for_pickup", "on_the_way"].includes(o.status));
  const completedOrders = filteredOrders.filter(o => o.status === "delivered");

  const todayEarnings = completedOrders
    .filter(o => new Date(o.delivered_at || "").toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + (o.customer_collected || 0) - (o.items?.reduce((s, i) => s + (i.actual_price || 0) * i.quantity, 0) || 0), 0);

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">wifi_off</span>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Something went wrong</h2>
          <p className="text-[var(--color-outline)] mb-6">{error}</p>
          <button
            onClick={() => loadOrders()}
            className="px-6 py-3 bg-brand-secondary text-white rounded-xl font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[var(--color-outline)] font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <PullToRefresh onRefresh={loadOrders}>
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="bg-brand-secondary text-white p-4 pb-6 rounded-b-[3rem]">
        <div className="flex justify-between items-center mb-4">
          <Link href="/rider/dashboard" className="text-2xl font-black tracking-tighter">MIIAM</Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAutoSkip(!showAutoSkip)} className="relative p-2 bg-[var(--color-surface-container-lowest)]/20 rounded-full">
              <span className="material-symbols-outlined">timer</span>
              {showAutoSkip && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
            <Link href="/rider/analytics" className="p-2 bg-[var(--color-surface-container-lowest)]/20 rounded-full">
              <span className="material-symbols-outlined">insights</span>
            </Link>
            <Link href="/rider/incident" className="p-2 bg-red-500/20 rounded-full">
              <span className="material-symbols-outlined text-red-400">emergency</span>
            </Link>
            <Link href="/rider/account" className="w-10 h-10 bg-[var(--color-surface-container-lowest)]/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">person</span>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID or customer..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm text-[var(--color-on-surface)]"
          />
        </div>

        {/* Date Filter */}
        <div className="flex gap-2 flex-wrap">
          {(["today", "week", "month"] as const).map(p => (
            <button
              key={p}
              onClick={() => setDateFilter(p)}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold ${
                dateFilter === p ? "bg-[var(--color-surface-container-lowest)] text-brand-secondary" : "bg-[var(--color-surface-container-lowest)]/10 text-white/70"
              }`}
            >
              {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold ${
              sortBy !== "newest" ? "bg-[var(--color-surface-container-lowest)] text-brand-secondary" : "bg-[var(--color-surface-container-lowest)]/10 text-white/70"
            }`}
          >
            <option value="newest">Newest First</option>
            <option value="earnings_high">Highest Earnings</option>
            <option value="distance">Nearest</option>
          </select>
        </div>
      </header>

      {/* Auto Skip Settings */}
      {showAutoSkip && (
        <div className="mx-4 -mt-2 bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">Auto-Skip Orders</p>
              <p className="text-xs text-[var(--color-outline)]">Decline after {autoSkipTime} seconds</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setAutoSkipTime(Math.max(10, autoSkipTime - 5))} className="w-10 h-10 bg-[var(--color-surface-container)] rounded-full font-bold">-</button>
              <span className="font-bold w-8 text-center">{autoSkipTime}s</span>
              <button onClick={() => setAutoSkipTime(Math.min(60, autoSkipTime + 5))} className="w-10 h-10 bg-[var(--color-surface-container)] rounded-full font-bold">+</button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${autoSkipTime > 0 ? "bg-green-500" : "bg-slate-300"}`}></span>
            <span className="text-xs text-[var(--color-outline)]">{autoSkipTime > 0 ? "Auto-skip enabled" : "Disabled"}</span>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar">
        <div className="bg-[var(--color-surface-container-lowest)] px-4 py-2 rounded-xl shadow-sm min-w-[90px] shrink-0">
          <p className="text-[10px] text-[var(--color-outline-variant)]">TODAY'S EARNINGS</p>
          <p className="font-black text-green-600 text-sm">₹{todayEarnings}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] px-4 py-2 rounded-xl shadow-sm min-w-[80px] shrink-0">
          <p className="text-[10px] text-[var(--color-outline-variant)]">COMPLETED</p>
          <p className="font-black text-brand-secondary text-sm">{completedOrders.length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] px-4 py-2 rounded-xl shadow-sm min-w-[90px] shrink-0">
          <p className="text-[10px] text-[var(--color-outline-variant)]">IN PROGRESS</p>
          <p className="font-black text-purple-600 text-sm">{shoppingOrders.length}</p>
        </div>
      </div>

      <main className="p-4 space-y-4 pb-32">
        {/* Tabs */}
        <div className="flex gap-2 bg-[var(--color-surface-container-lowest)] p-1 rounded-xl">
          {(["available", "shopping", "completed", "history"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize ${
                activeTab === tab ? "bg-brand-secondary text-white" : "text-[var(--color-outline)]"
              }`}
            >
              {tab} {tab === "available" ? `(${availableOrders.length})` : tab === "shopping" ? `(${shoppingOrders.length})` : tab === "completed" ? `(${completedOrders.length})` : ""}
            </button>
          ))}
        </div>

        {/* Batch Accept Bar */}
        {activeTab === "available" && selectedOrders.length > 0 && (
          <div className="fixed bottom-24 left-4 right-4 bg-green-500 text-white p-3 rounded-xl flex items-center justify-between shadow-lg z-40"
            style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <span className="font-bold">{selectedOrders.length} orders selected</span>
            <button onClick={batchAccept} className="bg-[var(--color-surface-container-lowest)] text-green-600 px-4 py-2.5 rounded-lg font-bold">
              Accept All
            </button>
          </div>
        )}

        {activeTab === "available" && (
          <>
            {availableOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onAccept={() => acceptOrder(order.id)}
                isSelected={selectedOrders.includes(order.id)}
                onToggleSelect={() => toggleSelectOrder(order.id)}
              />
            ))}
            {availableOrders.length === 0 && (
              <div className="text-center py-12 text-[var(--color-outline-variant)]">
                <span className="material-symbols-outlined text-4xl">shopping_bag</span>
                <p className="mt-2">No orders available</p>
              </div>
            )}
          </>
        )}

        {activeTab === "shopping" && (
          <>
            {shoppingOrders.map(order => (
              <ShoppingCard 
                key={order.id} 
                order={order}
                riderId={riderProfile?.id || ''}
                onUpdateItemStatus={(itemId, status, price) => updateItemStatus(order.id, itemId, status, price)}
                onMarkDelivered={() => markDelivered(order.id)}
                onReportIssue={() => { setCurrentOrderId(order.id); setShowIssueModal(true); }}
                onStartDelivery={() => startDelivery(order.id)}
                onShareLocation={() => updateRiderLocation(order.id)}
              />
            ))}
            {shoppingOrders.length === 0 && (
              <div className="text-center py-12 text-[var(--color-outline-variant)]">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
                <p className="mt-2">No active shopping</p>
              </div>
            )}
          </>
        )}

        {activeTab === "completed" && (
          <>
            {completedOrders.map(order => (
              <CompletedCard key={order.id} order={order} />
            ))}
            {completedOrders.length === 0 && (
              <div className="text-center py-12 text-[var(--color-outline-variant)]">
                <span className="material-symbols-outlined text-4xl">history</span>
                <p className="mt-2">No completed orders</p>
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <>
            <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-[var(--color-on-surface)] mb-3">📊 Performance Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-[var(--color-surface-subtle)] rounded-xl">
                  <p className="text-2xl font-black text-brand-secondary">{orders.length}</p>
                  <p className="text-xs text-[var(--color-outline-variant)]">Total Orders</p>
                </div>
                <div className="text-center p-3 bg-[var(--color-surface-subtle)] rounded-xl">
                  <p className="text-2xl font-black text-green-600">₹{todayEarnings}</p>
                  <p className="text-xs text-[var(--color-outline-variant)]">Today&apos;s Earnings</p>
                </div>
              </div>
            </div>
            {orders.map(order => (
              <HistoryCard key={order.id} order={order} />
            ))}
          </>
        )}
      </main>

      {/* Cash Collection Modal */}
      {showCashCollectModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-green-600 text-4xl">payments</span>
              </div>
              <h3 className="font-bold text-xl">Collect Payment</h3>
            </div>
            <div className="bg-green-50 p-4 rounded-xl mb-4">
              <p className="text-sm text-green-700">Amount to collect from customer:</p>
              <p className="text-3xl font-black text-green-600">₹{cashToCollect}</p>
            </div>
            <div className="space-y-2 mb-4">
              <button onClick={() => setCashToCollect(cashToCollect + 10)} className="w-full py-2 border border-[var(--color-border-subtle)] rounded-lg font-bold">+₹10</button>
              <button onClick={() => setCashToCollect(cashToCollect + 50)} className="w-full py-2 border border-[var(--color-border-subtle)] rounded-lg font-bold">+₹50</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCashCollectModal(false)} className="flex-1 py-3 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] font-bold rounded-xl">Cancel</button>
              <button onClick={confirmDelivery} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl">Confirm & Complete</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Reporting Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl mb-4">Report Issue</h3>
            <div className="space-y-2">
              {["Wrong Items", "Store Closed", "Customer Unreachable", "Safety Concern", "Other"].map(issue => (
                <button
                  key={issue}
                  onClick={async () => {
                    setIssueType(issue);
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        const { data: rider } = await supabase.from("riders").select("id").eq("user_id", user.id).single();
                        if (rider) {
                          await supabase.from("rider_incidents").insert({
                            rider_id: rider.id,
                            type: issue,
                            description: `Issue with order ${currentOrderId}`,
                            status: "reported",
                          });
                        }
                      }
                      showToast(`Issue "${issue}" reported.`, "success");
                    } catch (e) {
                      showToast("Failed to report issue. Please try again.", "error");
                    }
                    setShowIssueModal(false);
                  }}
                  className="w-full p-3 text-left bg-[var(--color-surface-subtle)] rounded-xl font-bold hover:bg-[var(--color-surface-container)]"
                >
                  {issue}
                </button>
              ))}
            </div>
            <button onClick={() => setShowIssueModal(false)} className="w-full mt-4 py-3 text-[var(--color-outline)] font-bold">Cancel</button>
          </div>
        </div>
      )}

    </div>
    </PullToRefresh>
    {toast && (
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-4 py-3 rounded-xl shadow-lg text-sm font-bold text-white ${
        toast.type === "success" ? "bg-green-500" : toast.type === "error" ? "bg-red-500" : "bg-slate-700"
      }`}>
        {toast.message}
      </div>
    )}
    </>
  );
}

function OrderCard({ order, onAccept, isSelected, onToggleSelect }: { order: Order; onAccept: () => void; isSelected: boolean; onToggleSelect: () => void }) {
  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const estimatedEarning = order.total_amount + (order.delivery_fee || 0);

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 shadow-lg border-2 border-transparent hover:border-brand-secondary/30">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-3">
          <button onClick={onToggleSelect} className={`mt-1 w-10 h-10 rounded-full border-2 flex items-center justify-center ${isSelected ? "bg-brand-secondary border-brand-secondary" : "border-[var(--color-outline-variant)]"}`}>
            {isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[var(--color-on-surface)]">{order.vendor?.name}</h3>
              <span className="text-[10px] font-bold text-brand-secondary bg-[#c4d0ff]/50 px-2 py-0.5 rounded-full">For {order.customer_name || "Customer"}</span>
            </div>
            <p className="text-xs text-[var(--color-outline-variant)] flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">store</span>
              {order.vendor?.address}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-green-600">₹{estimatedEarning}</p>
          <p className="text-[10px] text-[var(--color-outline-variant)]">{totalItems} items</p>
        </div>
      </div>
      
      <div className="bg-[var(--color-surface-subtle)] rounded-lg p-2 mb-3">
        <p className="text-[10px] text-[var(--color-outline-variant)] mb-1">📍 DELIVER TO:</p>
        <p className="text-sm">{order.address?.street}</p>
      </div>

      {order.special_instructions && (
        <div className="bg-amber-50 text-amber-800 text-xs p-2 rounded-lg mb-3">
          📝 {order.special_instructions}
        </div>
      )}

      <div className="flex gap-2">
        <a href={`tel:${order.customer_phone}`} className="flex-1 py-2 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-bold rounded-lg text-center text-sm flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-sm">call</span>
          Call
        </a>
        <button onClick={onAccept} className="flex-[2] bg-brand-secondary text-white py-2 rounded-lg font-bold text-sm">
          Start Shopping
        </button>
      </div>
    </div>
  );
}

function ShoppingCard({ order, riderId, onUpdateItemStatus, onMarkDelivered, onReportIssue, onStartDelivery, onShareLocation }: { order: Order; riderId: string; onUpdateItemStatus: (itemId: string, status: string, price?: number) => void; onMarkDelivered: () => void; onReportIssue: () => void; onStartDelivery?: () => void; onShareLocation?: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const items = order.items || [];
  const pickedCount = items.filter((i: any) => i.status === "available").length;
  const totalSpent = items.reduce((s: number, i: any) => s + ((i.actual_price || 0) * i.quantity), 0);
  const profit = (order.total_amount || 0) + (order.delivery_fee || 0) - totalSpent;

  // Phase: "pickup" = go to restaurant, "delivery" = go to customer
  const phase = order.status === "on_the_way" ? "delivery" : "pickup";
  const [expanded, setExpanded] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const routeLayerRef = useRef<any[]>([]);
  const destLatLngRef = useRef<[number, number] | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<{ eta: number; distance: string } | null>(null);
  const locationWatchRef = useRef<number | null>(null);
  const prevPhaseRef = useRef(phase);

  const deliveryAddress = (order as any).delivery_address || order.address?.street || "";
  const vendorAddress = order.vendor?.address || "";
  const customerPhone = order.customer_phone || "";

  // Broadcast GPS position continuously
  useEffect(() => {
    if (riderId) {
      startLocationTracking(riderId, order.id);
    }
    return () => {
      stopLocationTracking();
    };
  }, [order.id, riderId]);

  // When phase changes, destroy map so it re-initialises for new destination
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      prevPhaseRef.current = phase;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        riderMarkerRef.current = null;
        routeLayerRef.current = [];
        destLatLngRef.current = null;
        setTrackingInfo(null);
      }
    }
  }, [phase]);

  // Initialise / re-initialise map
  useEffect(() => {
    if (!showMap || !mapRef.current || mapInstanceRef.current) return;
    let isMounted = true;

    async function initMap() {
      if (!isMounted || !mapRef.current) return;
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Get rider GPS
      let riderLat = 26.1445, riderLng = 91.7362;
      await new Promise<void>((res) => {
        navigator.geolocation.getCurrentPosition(
          (p) => { riderLat = p.coords.latitude; riderLng = p.coords.longitude; res(); },
          () => res(), { timeout: 6000, enableHighAccuracy: true }
        );
      });

      const map = L.map(mapRef.current!, { zoomControl: false }).setView([riderLat, riderLng], 15);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;

      // Rider marker (blue scooter)
      const riderIcon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:46px;height:46px">
          <div style="position:absolute;inset:0;background:rgba(11,80,213,0.2);border-radius:50%;animation:pulse-ring 1s ease-out infinite"></div>
          <div style="position:absolute;inset:4px;background:#0b50d5;border-radius:50%;border:3px solid white;box-shadow:0 4px 14px rgba(11,80,213,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;">🛵</div>
        </div>`,
        iconSize: [46, 46], iconAnchor: [23, 46],
      });
      const riderMarker = L.marker([riderLat, riderLng], { icon: riderIcon, zIndexOffset: 1000 })
        .bindPopup('<b>You</b>').addTo(map);
      riderMarkerRef.current = riderMarker;

      // Destination marker colour/emoji by phase
      const isPickup = phase === "pickup";
      const destColor = isPickup ? "#16a34a" : "var(--color-primary)";
      const destEmoji = isPickup ? "🏪" : "🏠";
      const destLabel = isPickup ? "Pick up here" : "Deliver here";
      const destAddr = isPickup ? vendorAddress : deliveryAddress;

      const destIcon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:44px;height:44px">
          <div style="position:absolute;inset:0;background:${destColor}22;border-radius:50%;animation:pulse-ring 1.4s ease-out infinite"></div>
          <div style="position:absolute;inset:4px;background:${destColor};border-radius:50%;border:3px solid white;box-shadow:0 4px 12px ${destColor}66;display:flex;align-items:center;justify-content:center;font-size:18px;">${destEmoji}</div>
        </div>`,
        iconSize: [44, 44], iconAnchor: [22, 44],
      });

      async function drawRoute(rLat: number, rLng: number, dLat: number, dLng: number) {
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${rLng},${rLat};${dLng},${dLat}?overview=full&geometries=geojson`
          );
          const data = await res.json();
          if (data.routes?.[0] && isMounted && mapInstanceRef.current) {
            // Remove old route layers
            routeLayerRef.current.forEach(l => map.removeLayer(l));
            routeLayerRef.current = [];
            const coords = data.routes[0].geometry.coordinates.map((c: [number,number]) => [c[1], c[0]]);
            const shadow = L.polyline(coords, { color: `${destColor}33`, weight: 10, lineCap: 'round' }).addTo(map);
            const line = L.polyline(coords, { color: destColor, weight: 5, lineCap: 'round' }).addTo(map);
            routeLayerRef.current = [shadow, line];
            const eta = Math.round(data.routes[0].duration / 60);
            const dist = (data.routes[0].distance / 1000).toFixed(1);
            if (isMounted) setTrackingInfo({ eta, distance: dist });
            map.fitBounds([[rLat, rLng], [dLat, dLng]], { padding: [40, 40] });
          }
        } catch (e) { console.warn("Map routing error:", e); }
      }

      // Geocode destination address
      let geoSuccess = false;
      const searchAddr = destAddr || (isPickup && order.vendor?.name ? order.vendor.name : null);
      if (searchAddr) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddr)}&limit=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'MIIAM/1.0' } }
          );
          const data = await res.json();
          if (data[0] && isMounted) {
            const dLat = parseFloat(data[0].lat);
            const dLng = parseFloat(data[0].lon);
            destLatLngRef.current = [dLat, dLng];
            L.marker([dLat, dLng], { icon: destIcon })
              .bindPopup(`<b>${destLabel}</b><br><span style="font-size:11px">${searchAddr}</span>`)
              .openPopup().addTo(map);
            await drawRoute(riderLat, riderLng, dLat, dLng);
            geoSuccess = true;
          }
        } catch (e) { console.warn("Map routing error:", e); }
      }

      if (!geoSuccess && isMounted) {
        // Fallback so the map isn't stuck loading forever
        setTrackingInfo({ eta: 0, distance: "0.0" });
      }

      // Live rider position updates from Supabase
      const channel = supabase.channel(`rider-loc-${order.id}-${phase}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rider_locations', filter: `order_id=eq.${order.id}` },
          async (payload: any) => {
            const loc = payload.new;
            if (loc?.lat && loc?.lng && isMounted && mapInstanceRef.current) {
              riderMarkerRef.current?.setLatLng([loc.lat, loc.lng]);
              if (destLatLngRef.current) {
                await drawRoute(loc.lat, loc.lng, destLatLngRef.current[0], destLatLngRef.current[1]);
              }
            }
          }).subscribe();

      return () => { isMounted = false; supabase.removeChannel(channel); };
    }

    initMap();
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [showMap, phase, order.id, vendorAddress, deliveryAddress]);

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-lg overflow-hidden">
      <style>{`
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
        @keyframes slide-up { from{transform:translateY(6px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      {/* === Compact Header — always visible === */}
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className={`px-4 py-3 flex items-center gap-3 ${phase === "pickup" ? "bg-gradient-to-r from-green-600 to-emerald-500" : "bg-gradient-to-r from-brand-secondary to-indigo-600"}`}>
          <div className="w-9 h-9 bg-[var(--color-surface-container-lowest)]/20 rounded-full flex items-center justify-center text-base flex-shrink-0">
            {phase === "pickup" ? "🏪" : "🏠"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-extrabold text-xs truncate">{order.vendor?.name || "Order"}</p>
              <span className="text-[10px] text-white/70 font-bold bg-[var(--color-surface-container-lowest)]/10 px-1.5 py-0.5 rounded-full shrink-0">{phase === "pickup" ? "Pickup" : "Delivery"}</span>
            </div>
            <p className="text-white/80 text-[10px] truncate mt-0.5">
              {phase === "pickup" ? vendorAddress : deliveryAddress}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white font-extrabold text-sm">₹{order.total_amount + (order.delivery_fee || 0)}</p>
            <p className="text-[9px] text-white/70 font-bold">{pickedCount}/{items.length} picked</p>
          </div>
          <span className="material-symbols-outlined text-white text-lg transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </div>
      </button>

      {/* === Expanded Details === */}
      {expanded && (
        <div style={{ animation: 'slide-up 0.25s ease' }}>
          {/* ETA Strip */}
          {trackingInfo && (
            <div className="flex border-b border-[var(--color-border-subtle)]">
              <div className={`flex-1 py-2 text-center border-r border-[var(--color-border-subtle)] ${phase === "pickup" ? "bg-green-50" : "bg-blue-50"}`}>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-outline-variant)]">ETA</p>
                <p className={`text-lg font-black ${phase === "pickup" ? "text-green-600" : "text-brand-secondary"}`}>
                  {trackingInfo.eta}<span className="text-xs font-normal ml-0.5">min</span>
                </p>
              </div>
              <div className="flex-1 py-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-outline-variant)]">Distance</p>
                <p className="text-lg font-black text-[var(--color-on-surface)]">{trackingInfo.distance}<span className="text-xs font-normal ml-0.5">km</span></p>
              </div>
              <div className="flex-1 py-2 text-center border-l border-[var(--color-border-subtle)]">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-outline-variant)]">GPS</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span style={{ width:7,height:7,borderRadius:'50%',background:'#22c55e',display:'inline-block',boxShadow:'0 0 0 2px rgba(34,197,94,0.25)'}}></span>
                  <span className="text-[10px] font-bold text-green-600">Live</span>
                </div>
              </div>
            </div>
          )}

          {/* Map (collapsible) */}
          {showMap && (
            <div className="relative">
              <div ref={mapRef} className="w-full" style={{ height: 200 }} />
              {!trackingInfo && (
                <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center z-[400]">
                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg">
                    <div className="w-4 h-4 border-2 border-brand-secondary border-t-transparent rounded-full animate-spin"/>
                    <span className="text-sm font-bold text-[var(--color-on-surface)]">Loading route...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="px-4 pt-2 pb-1 flex gap-2">
            <button onClick={() => setShowMap(!showMap)} className="text-[10px] font-bold text-brand-secondary bg-blue-50 px-4 py-2.5 rounded-lg flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">{showMap ? "visibility_off" : "map"}</span>
              {showMap ? "Hide Map" : "Show Map"}
            </button>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(phase === "pickup" ? vendorAddress : deliveryAddress)}&travelmode=driving`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-white bg-brand-secondary px-4 py-2.5 rounded-lg flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">navigation</span>
              Google Maps
            </a>
          </div>

          {/* Vendor / Customer Info */}
          <div className="px-4 py-2 space-y-1">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--color-outline-variant)] truncate">{order.vendor?.address}</p>
                <p className="text-[10px] text-[var(--color-primary)] font-semibold flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[10px]">location_on</span>
                  <span className="truncate">{deliveryAddress}</span>
                </p>
                {customerPhone && (
                  <a href={`tel:${customerPhone}`} className="text-[10px] text-brand-secondary font-semibold flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[10px]">call</span>
                    Call {customerPhone}
                  </a>
                )}
              </div>
            </div>
            {/* Progress */}
            <div className="bg-[var(--color-surface-subtle)] rounded-lg p-2">
              <div className="bg-[var(--color-surface-container-high)] rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${items.length ? (pickedCount / items.length) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] text-[var(--color-outline)] mt-1">{pickedCount}/{items.length} items picked</p>
            </div>
          </div>

          {/* Items List (compact) */}
          <div className="px-4 space-y-1 mb-2 max-h-40 overflow-y-auto">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-1.5 p-2 bg-[var(--color-surface-subtle)] rounded-lg">
                <select
                  value={item.status || "pending"}
                  onChange={(e) => onUpdateItemStatus(item.id, e.target.value, item.actual_price)}
                  className={`text-[10px] font-bold px-1.5 py-1 rounded border-0 ${
                    item.status === "available" ? "bg-green-100 text-green-700" :
                    item.status === "unavailable" ? "bg-red-100 text-red-700" :
                    item.status === "different_brand" ? "bg-amber-100 text-amber-700" :
                    "bg-[var(--color-surface-container)] text-[var(--color-outline)]"
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="available">✅ Available</option>
                  <option value="unavailable">❌ Unavail</option>
                  <option value="different_brand">🔄 Diff Brand</option>
                </select>
                <span className="flex-1 text-[11px] font-medium truncate">{item.quantity}x {item.menu_item?.name || item.name}</span>
                <span className="text-[10px] text-[var(--color-outline-variant)] shrink-0">₹{item.unit_price}</span>
                {item.status === "available" && (
                  <input
                    type="number"
                    placeholder="Actual"
                    value={item.actual_price || ""}
                    onChange={(e) => onUpdateItemStatus(item.id, "available", parseFloat(e.target.value))}
                    className="w-14 text-[10px] border border-[var(--color-border-subtle)] rounded px-1.5 py-1 bg-white"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Financial Summary */}
          <div className="px-4 mb-2">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg">
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--color-outline)]">Spent</span>
                <span className="font-bold">₹{totalSpent.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--color-outline)]">Collect</span>
                <span className="font-bold text-brand-secondary">₹{order.total_amount + (order.delivery_fee || 0)}</span>
              </div>
              <div className="flex justify-between text-[11px] border-t pt-0.5 mt-0.5">
                <span className="font-bold">Profit</span>
                <span className="font-black text-green-600">₹{profit.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 space-y-1.5">
            <div className="flex gap-1.5">
              {pickedCount === items.length && items.length > 0 && onStartDelivery && order.status !== "on_the_way" && (
                <button onClick={onStartDelivery} className="flex-1 py-2 bg-brand-secondary text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">directions_bike</span>
                  Start Delivery
                </button>
              )}
              {order.status === "on_the_way" && onShareLocation && (
                <button onClick={onShareLocation} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">share_location</span>
                  Share Location
                </button>
              )}
              <button onClick={onReportIssue} className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold border border-red-100">
                Report
              </button>
            </div>
            <button onClick={onMarkDelivered} disabled={pickedCount === 0} className="w-full bg-green-500 text-white py-2.5 rounded-lg font-bold disabled:opacity-40 flex items-center justify-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-sm">payments</span>
              Complete & Collect ₹{(order.total_amount || 0) + (order.delivery_fee || 0)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function CompletedCard({ order }: { order: Order }) {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-[var(--color-on-surface)]">{order.vendor?.name}</h3>
          <p className="text-xs text-[var(--color-outline-variant)]">{new Date(order.delivered_at || "").toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-green-600">₹{order.customer_collected || 0}</p>
          <p className="text-[10px] text-green-500">Collected</p>
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ order }: { order: Order }) {
  const spent = order.items?.reduce((s, i) => s + ((i.actual_price || 0) * i.quantity), 0) || 0;
  const earned = (order.customer_collected || 0) - spent;

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-3 shadow-sm mb-2">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold text-sm">{order.vendor?.name}</p>
          <p className="text-xs text-[var(--color-outline-variant)]">{new Date(order.placed_at).toLocaleDateString("en-IN")}</p>
        </div>
        <div className="text-right">
          <p className={`font-bold ${earned >= 0 ? "text-green-600" : "text-red-500"}`}>
            {earned >= 0 ? "+" : ""}₹{earned}
          </p>
          <p className="text-[9px] text-[var(--color-outline-variant)]">{order.status}</p>
        </div>
      </div>
    </div>
  );
}
