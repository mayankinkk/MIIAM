"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  id: string;
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
  status: string;
  total_amount: number;
  delivery_fee: number;
  special_instructions: string | null;
  placed_at: string;
  delivered_at?: string;
  customer_collected?: number;
  vendor?: {
    name: string;
    address: string;
    phone: string;
  };
  address?: {
    street: string;
    city: string;
  };
  customer_phone?: string;
  customer_name?: string;
  items?: OrderItem[];
}

export default function RiderOrdersPage() {
  const supabase = createClient();
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

  async function loadOrders() {
    setLoading(true);

    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const { data: dbOrders } = await supabase
      .from("orders")
      .select("*")
      .is("rider_id", null)
      .in("status", ["pending", "accepted", "preparing"])
      .gte("placed_at", yesterday.toISOString())
      .order("placed_at", { ascending: false });

    if (dbOrders && dbOrders.length > 0) {
      const fullOrders = await Promise.all(dbOrders.map(async (order) => {
        const [vendorRes, addressRes, itemsRes, userRes] = await Promise.all([
          order.vendor_id ? supabase.from("vendors").select("*").eq("id", order.vendor_id).single() : Promise.resolve({ data: null }),
          order.delivery_address_id ? supabase.from("delivery_addresses").select("*").eq("id", order.delivery_address_id).single() : Promise.resolve({ data: null }),
          supabase.from("order_items").select("*").eq("order_id", order.id),
          order.user_id ? supabase.from("profiles").select("full_name").eq("id", order.user_id).single() : Promise.resolve({ data: null })
        ]);

        let items = itemsRes.data || [];
        if (items.length > 0) {
          const menuItemIds = items.map(i => i.menu_item_id).filter(Boolean);
          if (menuItemIds.length > 0) {
            const { data: menuItems } = await supabase.from("menu_items").select("*").in("id", menuItemIds);
            if (menuItems) {
              items = items.map(item => ({
                ...item,
                menu_item: menuItems.find(mi => mi.id === item.menu_item_id) || null
              }));
            }
          }
        }

        return {
          ...order,
          vendor: vendorRes.data,
          address: addressRes.data,
          items: items,
          customer_name: userRes.data?.full_name || "Customer"
        };
      }));
      setOrders(fullOrders);
    }
    setLoading(false);
  }

  useEffect(() => {
    setRiderLocation({
      lat: 28.6139 + (Math.random() - 0.5) * 0.01,
      lng: 77.2090 + (Math.random() - 0.5) * 0.01
    });
    loadOrders();

    const channel = supabase
      .channel('rider-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        const newOrder = payload.new as { id?: string; status: string; total_amount: number };
        if (newOrder.status === 'pending' || newOrder.status === 'preparing') {
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
      }, (payload) => {
        const updatedOrder = payload.new as { id: string; status: string };
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please login first");
        return;
      }

      console.log("Accepting order:", orderId, "user:", user.id);

      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "accepted", 
          rider_id: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) {
        console.error("Update error:", error);
        alert("Error: " + error.message);
        return;
      }

      const order = orders.find(o => o.id === orderId);
      if (order?.user_id) {
        try {
          await supabase.from("notifications").insert({
            user_id: order.user_id,
            title: "Order Accepted! 🎉",
            message: "A rider has accepted your order and will start shopping soon.",
            type: "order",
            read: false,
          });
        } catch (notifErr) {
          console.log("Notification error (non-critical):", notifErr);
        }
      }

      setOrders(orders.map(o => o.id === orderId ? { ...o, status: "accepted", rider_id: user.id } : o));
      alert("Order accepted! Start shopping.");
    } catch (err: any) {
      console.error("Error accepting order:", err);
      alert("Failed to accept order: " + (err?.message || "Unknown error"));
    }
  }

  async function batchAccept() {
    if (selectedOrders.length === 0) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      for (const orderId of selectedOrders) {
        await supabase
          .from("orders")
          .update({ 
            status: "accepted", 
            rider_id: user.id,
            accepted_at: new Date().toISOString()
          })
          .eq("id", orderId);
      }
      
      setOrders(orders.map(o => selectedOrders.includes(o.id) ? { ...o, status: "accepted", rider_id: user.id } : o));
      alert(`${selectedOrders.length} orders accepted!`);
      setSelectedOrders([]);
    } catch (err) {
      console.error("Error batch accepting:", err);
      alert("Failed to accept orders");
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
        alert("Failed to update item: " + error.message);
        return;
      }
    } catch (err) {
      console.error("Update error:", err);
    }
    
    // Update local state
    setOrders(orders.map(o => {
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
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from("orders")
        .update({ 
          status: "delivered", 
          delivered_at: new Date().toISOString(),
          customer_collected: cashToCollect
        })
        .eq("id", currentOrderId);

      const order = orders.find(o => o.id === currentOrderId);
      if (order?.user_id) {
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          title: "Order Delivered! 🎉",
          message: `Your order has been delivered. ₹${cashToCollect} collected. Enjoy your food!`,
          type: "order",
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      setOrders(orders.map(o => o.id === currentOrderId ? { ...o, status: "delivered", delivered_at: new Date().toISOString(), customer_collected: cashToCollect } : o));
      setShowCashCollectModal(false);
      alert(`Delivery complete! ₹${cashToCollect} collected from customer.`);
    } catch (err) {
      console.error("Error delivering order:", err);
      alert("Failed to complete delivery.");
    }
  }

  async function startDelivery(orderId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

        // Browser notification
        if (typeof window !== "undefined" && Notification.permission === "granted") {
          new Notification("Order On The Way! 🚴", {
            body: "Your rider has picked up your order and is heading to you",
            icon: "/icon.png",
          });
        }

        await supabase.from("rider_locations").insert({
          order_id: orderId,
          rider_id: user.id,
          rider_name: user.email?.split('@')[0] || 'Rider',
          rider_phone: '',
          lat: riderLocation.lat,
          lng: riderLocation.lng,
        });
      }

      setOrders(orders.map(o => o.id === orderId ? { ...o, status: "on_the_way" } : o));
    } catch (err) {
      console.error("Error starting delivery:", err);
    }
  }

  async function updateRiderLocation(orderId: string) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("rider_locations").insert({
        order_id: orderId,
        rider_id: user.id,
        rider_name: user.email?.split('@')[0] || 'Rider',
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

  const availableOrders = filteredOrders.filter(o => o.status === "pending" || o.status === "preparing");
  const shoppingOrders = filteredOrders.filter(o => o.status === "shopping" || o.status === "accepted" || o.status === "on_the_way");
  const completedOrders = filteredOrders.filter(o => o.status === "delivered");

  const todayEarnings = completedOrders
    .filter(o => new Date(o.delivered_at || "").toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + (o.customer_collected || 0) - (o.items?.reduce((s, i) => s + (i.actual_price || 0) * i.quantity, 0) || 0), 0);

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-[#0b50d5] text-white p-4 pb-6 rounded-b-[3rem]">
        <div className="flex justify-between items-center mb-4">
          <Link href="/rider/dashboard" className="text-2xl font-black tracking-tighter">MIIAM</Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAutoSkip(!showAutoSkip)} className="relative p-2 bg-white/20 rounded-full">
              <span className="material-symbols-outlined">timer</span>
              {showAutoSkip && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
            <Link href="/rider/analytics" className="p-2 bg-white/20 rounded-full">
              <span className="material-symbols-outlined">insights</span>
            </Link>
            <Link href="/rider/incident" className="p-2 bg-red-500/20 rounded-full">
              <span className="material-symbols-outlined text-red-400">emergency</span>
            </Link>
            <Link href="/rider/account" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">person</span>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID or customer..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm text-slate-800"
          />
        </div>

        {/* Date Filter */}
        <div className="flex gap-2 flex-wrap">
          {(["today", "week", "month"] as const).map(p => (
            <button
              key={p}
              onClick={() => setDateFilter(p)}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold ${
                dateFilter === p ? "bg-white text-[#0b50d5]" : "bg-white/10 text-white/70"
              }`}
            >
              {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold ${
              sortBy !== "newest" ? "bg-white text-[#0b50d5]" : "bg-white/10 text-white/70"
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
        <div className="mx-4 -mt-2 bg-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">Auto-Skip Orders</p>
              <p className="text-xs text-slate-500">Decline after {autoSkipTime} seconds</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setAutoSkipTime(Math.max(10, autoSkipTime - 5))} className="w-8 h-8 bg-slate-100 rounded-full font-bold">-</button>
              <span className="font-bold w-8 text-center">{autoSkipTime}s</span>
              <button onClick={() => setAutoSkipTime(Math.min(60, autoSkipTime + 5))} className="w-8 h-8 bg-slate-100 rounded-full font-bold">+</button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${autoSkipTime > 0 ? "bg-green-500" : "bg-slate-300"}`}></span>
            <span className="text-xs text-slate-500">{autoSkipTime > 0 ? "Auto-skip enabled" : "Disabled"}</span>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar">
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm min-w-[90px] shrink-0">
          <p className="text-[10px] text-slate-400">TODAY'S EARNINGS</p>
          <p className="font-black text-green-600 text-sm">₹{todayEarnings}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm min-w-[80px] shrink-0">
          <p className="text-[10px] text-slate-400">COMPLETED</p>
          <p className="font-black text-[#0b50d5] text-sm">{completedOrders.length}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm min-w-[90px] shrink-0">
          <p className="text-[10px] text-slate-400">IN PROGRESS</p>
          <p className="font-black text-purple-600 text-sm">{shoppingOrders.length}</p>
        </div>
      </div>

      <main className="p-4 space-y-4 pb-32">
        {/* Tabs */}
        <div className="flex gap-2 bg-white p-1 rounded-xl">
          {(["available", "shopping", "completed", "history"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize ${
                activeTab === tab ? "bg-[#0b50d5] text-white" : "text-slate-500"
              }`}
            >
              {tab} {tab === "available" ? `(${availableOrders.length})` : tab === "shopping" ? `(${shoppingOrders.length})` : tab === "completed" ? `(${completedOrders.length})` : ""}
            </button>
          ))}
        </div>

        {/* Batch Accept Bar */}
        {activeTab === "available" && selectedOrders.length > 0 && (
          <div className="fixed bottom-24 left-4 right-4 bg-green-500 text-white p-3 rounded-xl flex items-center justify-between shadow-lg z-40">
            <span className="font-bold">{selectedOrders.length} orders selected</span>
            <button onClick={batchAccept} className="bg-white text-green-600 px-4 py-1 rounded-lg font-bold">
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
              <div className="text-center py-12 text-slate-400">
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
                onUpdateItemStatus={(itemId, status, price) => updateItemStatus(order.id, itemId, status, price)}
                onMarkDelivered={() => markDelivered(order.id)}
                onReportIssue={() => { setCurrentOrderId(order.id); setShowIssueModal(true); }}
                onStartDelivery={() => startDelivery(order.id)}
                onShareLocation={() => updateRiderLocation(order.id)}
              />
            ))}
            {shoppingOrders.length === 0 && (
              <div className="text-center py-12 text-slate-400">
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
              <div className="text-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl">history</span>
                <p className="mt-2">No completed orders</p>
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-[#4d212a] mb-3">📊 Performance Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-black text-[#0b50d5]">{orders.length}</p>
                  <p className="text-xs text-slate-400">Total Orders</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-black text-green-600">₹{(todayEarnings * 7).toFixed(0)}</p>
                  <p className="text-xs text-slate-400">Weekly Earnings</p>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
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
              <button onClick={() => setCashToCollect(cashToCollect + 10)} className="w-full py-2 border border-slate-200 rounded-lg font-bold">+₹10</button>
              <button onClick={() => setCashToCollect(cashToCollect + 50)} className="w-full py-2 border border-slate-200 rounded-lg font-bold">+₹50</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCashCollectModal(false)} className="flex-1 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl">Cancel</button>
              <button onClick={confirmDelivery} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl">Confirm & Complete</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Reporting Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl mb-4">Report Issue</h3>
            <div className="space-y-2">
              {["Wrong Items", "Store Closed", "Customer Unreachable", "Safety Concern", "Other"].map(issue => (
                <button
                  key={issue}
                  onClick={() => { setIssueType(issue); alert(`Issue "${issue}" reported. Support will contact you.`); setShowIssueModal(false); }}
                  className="w-full p-3 text-left bg-slate-50 rounded-xl font-bold hover:bg-slate-100"
                >
                  {issue}
                </button>
              ))}
            </div>
            <button onClick={() => setShowIssueModal(false)} className="w-full mt-4 py-3 text-slate-500 font-bold">Cancel</button>
          </div>
        </div>
      )}

      <RiderNavBar active="orders" />
    </div>
  );
}

function OrderCard({ order, onAccept, isSelected, onToggleSelect }: { order: Order; onAccept: () => void; isSelected: boolean; onToggleSelect: () => void }) {
  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const estimatedEarning = order.total_amount + (order.delivery_fee || 0);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-transparent hover:border-[#0b50d5]/30">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-3">
          <button onClick={onToggleSelect} className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "bg-[#0b50d5] border-[#0b50d5]" : "border-slate-300"}`}>
            {isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#4d212a]">{order.vendor?.name}</h3>
              <span className="text-[10px] font-bold text-[#0b50d5] bg-[#c4d0ff]/50 px-2 py-0.5 rounded-full">For {order.customer_name || "Customer"}</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">store</span>
              {order.vendor?.address}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-green-600">₹{estimatedEarning}</p>
          <p className="text-[10px] text-slate-400">{totalItems} items</p>
        </div>
      </div>
      
      <div className="bg-slate-50 rounded-lg p-2 mb-3">
        <p className="text-[10px] text-slate-400 mb-1">📍 DELIVER TO:</p>
        <p className="text-sm">{order.address?.street}</p>
      </div>

      {order.special_instructions && (
        <div className="bg-amber-50 text-amber-800 text-xs p-2 rounded-lg mb-3">
          📝 {order.special_instructions}
        </div>
      )}

      <div className="flex gap-2">
        <a href={`tel:${order.customer_phone}`} className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-center text-sm flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-sm">call</span>
          Call
        </a>
        <button onClick={onAccept} className="flex-[2] bg-[#0b50d5] text-white py-2 rounded-lg font-bold text-sm">
          Start Shopping
        </button>
      </div>
    </div>
  );
}

function ShoppingCard({ order, onUpdateItemStatus, onMarkDelivered, onReportIssue, onStartDelivery, onShareLocation }: { order: Order; onUpdateItemStatus: (itemId: string, status: string, price?: number) => void; onMarkDelivered: () => void; onReportIssue: () => void; onStartDelivery?: () => void; onShareLocation?: () => void }) {
  const supabase = createClient();
  const items = order.items || [];
  const pickedCount = items.filter((i: any) => i.status === "available").length;
  const totalSpent = items.reduce((s: number, i: any) => s + ((i.actual_price || 0) * i.quantity), 0);
  const profit = (order.total_amount || 0) + (order.delivery_fee || 0) - totalSpent;

  // Phase: "pickup" = go to restaurant, "delivery" = go to customer
  const phase = order.status === "on_the_way" ? "delivery" : "pickup";
  const [showMap, setShowMap] = useState(true); // always open
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
    async function broadcastLocation(lat: number, lng: number) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("rider_locations").upsert({
        order_id: order.id,
        rider_id: user.id,
        rider_name: user.email?.split('@')[0] || 'Rider',
        rider_phone: '',
        lat,
        lng,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'order_id' });
    }
    if (navigator.geolocation) {
      locationWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => broadcastLocation(pos.coords.latitude, pos.coords.longitude),
        null,
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }
    return () => {
      if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current);
    };
  }, [order.id]);

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
      const destColor = isPickup ? "#16a34a" : "#ba001c";
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
        } catch (_) {}
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
        } catch (_) {}
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
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* CSS */}
      <style>{`
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.8);opacity:0} }
        @keyframes slide-up { from{transform:translateY(6px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      {/* Phase Banner — like Uber/Ola top strip */}
      <div className={`px-4 py-3 flex items-center gap-3 ${phase === "pickup" ? "bg-gradient-to-r from-green-600 to-emerald-500" : "bg-gradient-to-r from-[#0b50d5] to-indigo-600"}`}>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl flex-shrink-0">
          {phase === "pickup" ? "🏪" : "🏠"}
        </div>
        <div className="flex-1">
          <p className="text-white font-extrabold text-sm">
            {phase === "pickup" ? "Phase 1 — Go to Restaurant" : "Phase 2 — Deliver to Customer"}
          </p>
          <p className="text-white/80 text-xs truncate">
            {phase === "pickup" ? (vendorAddress || order.vendor?.name || "Vendor location") : (deliveryAddress || "Customer address")}
          </p>
        </div>
        {phase === "pickup" && (
          <span className="text-white/70 text-[10px] font-bold bg-white/10 px-2 py-1 rounded-full">STEP 1/2</span>
        )}
        {phase === "delivery" && (
          <span className="text-white/70 text-[10px] font-bold bg-white/10 px-2 py-1 rounded-full">STEP 2/2</span>
        )}
      </div>

      {/* ETA Strip */}
      {trackingInfo && (
        <div className="flex border-b border-slate-100" style={{ animation: 'slide-up 0.3s ease' }}>
          <div className={`flex-1 py-3 text-center border-r border-slate-100 ${phase === "pickup" ? "bg-green-50" : "bg-blue-50"}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ETA</p>
            <p className={`text-2xl font-black ${phase === "pickup" ? "text-green-600" : "text-[#0b50d5]"}`}>
              {trackingInfo.eta}<span className="text-xs font-normal ml-0.5">min</span>
            </p>
          </div>
          <div className="flex-1 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Distance</p>
            <p className="text-2xl font-black text-slate-700">{trackingInfo.distance}<span className="text-xs font-normal ml-0.5">km</span></p>
          </div>
          <div className={`flex-1 py-3 text-center border-l border-slate-100`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">GPS</p>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span style={{ width:8,height:8,borderRadius:'50%',background:'#22c55e',display:'inline-block',boxShadow:'0 0 0 3px rgba(34,197,94,0.25)' }}></span>
              <span className="text-xs font-bold text-green-600">Live</span>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <div ref={mapRef} className="w-full" style={{ height: 240 }} />
        <button
          onClick={() => setShowMap(!showMap)}
          className="absolute top-2 right-2 z-[400] bg-white rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 shadow-md flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">{showMap ? "visibility_off" : "map"}</span>
          {showMap ? "Hide" : "Map"}
        </button>
        {!trackingInfo && (
          <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center z-[400]">
            <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg">
              <div className="w-4 h-4 border-2 border-[#0b50d5] border-t-transparent rounded-full animate-spin"/>
              <span className="text-sm font-bold text-slate-700">Loading route...</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigate button */}
      <div className="px-4 pt-3 pb-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(phase === "pickup" ? vendorAddress : deliveryAddress)}&travelmode=driving`}
          target="_blank"
          rel="noreferrer"
          className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${phase === "pickup" ? "bg-green-500 text-white" : "bg-[#0b50d5] text-white"}`}
        >
          <span className="material-symbols-outlined text-sm">navigation</span>
          Open in Google Maps →
        </a>
      </div>

      <div className="px-4 pb-3 space-y-1">
        {/* Vendor info */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-base text-[#4d212a]">{order.vendor?.name}</h3>
            <p className="text-xs text-slate-400">{order.vendor?.address}</p>
            <p className="text-xs text-[#ba001c] font-semibold flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs">location_on</span>
              Deliver: {deliveryAddress}
            </p>
            {customerPhone && (
              <a href={`tel:${customerPhone}`} className="text-xs text-[#0b50d5] font-semibold flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-xs">call</span>
                Call Customer: {customerPhone}
              </a>
            )}
          </div>
          <div className="text-right">
            <p className="text-base font-black text-[#0b50d5]">₹{order.total_amount + (order.delivery_fee || 0)}</p>
            <p className="text-[10px] text-slate-400">Collect from customer</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4">
        <div className="bg-slate-100 rounded-full h-2 mb-1 overflow-hidden">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${items.length ? (pickedCount / items.length) * 100 : 0}%` }} />
        </div>
        <p className="text-xs text-slate-500 mb-2">{pickedCount}/{items.length} items picked</p>
      </div>

      {/* Items List */}
      <div className="px-4 space-y-2 mb-3 max-h-48 overflow-y-auto">
        {items.map((item: any) => (
          <div key={item.id} className="flex flex-col gap-1 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm flex-1 min-w-0 truncate">{item.quantity}x {item.menu_item?.name || item.name}</p>
              <p className="text-xs text-slate-400 shrink-0">₹{item.unit_price}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={item.status || "pending"}
                onChange={(e) => onUpdateItemStatus(item.id, e.target.value, item.actual_price)}
                className={`flex-1 text-xs font-bold px-2 py-1.5 rounded-lg border-0 ${
                  item.status === "available" ? "bg-green-100 text-green-700" :
                  item.status === "unavailable" ? "bg-red-100 text-red-700" :
                  item.status === "different_brand" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-500"
                }`}
              >
                <option value="pending">Pending</option>
                <option value="available">✅ Available</option>
                <option value="unavailable">❌ Not Available</option>
                <option value="different_brand">🔄 Different Brand</option>
              </select>
              {item.status === "available" && (
                <input
                  type="number"
                  placeholder="Actual ₹"
                  value={item.actual_price || ""}
                  onChange={(e) => onUpdateItemStatus(item.id, "available", parseFloat(e.target.value))}
                  className="w-20 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Barcode Scanner */}
      <div className="px-4 mb-3">
        <button className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-sm font-bold flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
          Scan Barcode (Optional)
        </button>
      </div>

      {/* Financial Summary */}
      <div className="px-4 mb-3">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">You spent:</span>
            <span className="font-bold">₹{totalSpent.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Collect from customer:</span>
            <span className="font-bold text-[#0b50d5]">₹{order.total_amount + (order.delivery_fee || 0)}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-1 mt-1">
            <span className="font-bold">Your profit:</span>
            <span className="font-black text-green-600">₹{profit.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2">
        <div className="flex gap-2">
          {pickedCount === items.length && items.length > 0 && onStartDelivery && order.status !== "on_the_way" && (
            <button onClick={onStartDelivery} className="flex-1 py-2.5 px-3 bg-[#0b50d5] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-sm">directions_bike</span>
              Start Delivery
            </button>
          )}
          {order.status === "on_the_way" && onShareLocation && (
            <button onClick={onShareLocation} className="flex-1 py-2.5 px-3 bg-green-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-sm">share_location</span>
              Share Location
            </button>
          )}
          <button onClick={onReportIssue} className="py-2.5 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
            Report
          </button>
        </div>
        <button
          onClick={onMarkDelivered}
          disabled={pickedCount === 0}
          className="w-full bg-green-500 text-white py-3 rounded-xl font-bold disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-sm">payments</span>
          Complete &amp; Collect ₹{(order.total_amount || 0) + (order.delivery_fee || 0)}
        </button>
      </div>
    </div>
  );
}


function CompletedCard({ order }: { order: Order }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-[#4d212a]">{order.vendor?.name}</h3>
          <p className="text-xs text-slate-400">{new Date(order.delivered_at || "").toLocaleString()}</p>
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
    <div className="bg-white rounded-xl p-3 shadow-sm mb-2">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold text-sm">{order.vendor?.name}</p>
          <p className="text-xs text-slate-400">{new Date(order.placed_at).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <p className={`font-bold ${earned >= 0 ? "text-green-600" : "text-red-500"}`}>
            {earned >= 0 ? "+" : ""}₹{earned}
          </p>
          <p className="text-[9px] text-slate-400">{order.status}</p>
        </div>
      </div>
    </div>
  );
}

function RiderNavBar({ active }: { active: string }) {
  const navItems = [
    { name: "Map", href: "/rider/dashboard", icon: "map" },
    { name: "Orders", href: "/rider/orders", icon: "list_alt" },
    { name: "Wallet", href: "/rider/wallet", icon: "account_balance_wallet" },
    { name: "Account", href: "/rider/account", icon: "person" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-4 bg-white/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[2rem]"
      style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {navItems.map(item => (
        <Link
          key={item.name}
          href={item.href}
          className={`flex flex-col items-center p-2 ${
            active === item.name.toLowerCase() ? "text-[#0b50d5]" : "text-[#814c55]"
          }`}
        >
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: active === item.name.toLowerCase() ? "'FILL' 1" : "'FILL' 0" }}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}