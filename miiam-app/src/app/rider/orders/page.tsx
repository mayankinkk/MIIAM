"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  special_notes: string | null;
  status: "pending" | "picked" | "unavailable" | "different_brand";
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
  const [showAutoSkip, setShowAutoSkip] = useState(false);
  const [autoSkipTime, setAutoSkipTime] = useState(30);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showCashCollectModal, setShowCashCollectModal] = useState(false);
  const [cashToCollect, setCashToCollect] = useState(0);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueType, setIssueType] = useState("");

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel('rider-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        const newOrder = payload.new as any;
        if (newOrder.status === 'pending' || newOrder.status === 'preparing') {
          setOrders(prev => [newOrder, ...prev]);
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function loadOrders() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, vendor:vendors(*), address:delivery_address_id(*), items:order_items(*, menu_item:menu_items(*))")
      .order("placed_at", { ascending: false });
    if (data && data.length > 0) {
      setOrders(data);
    }
    setLoading(false);
  }

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
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          title: "Order Accepted! 🎉",
          message: "A rider has accepted your order and will start shopping soon.",
          type: "order",
          read: false,
          created_at: new Date().toISOString(),
        }).catch(() => {});
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

        await supabase.from("rider_locations").insert({
          order_id: orderId,
          rider_id: user.id,
          rider_name: user.email?.split('@')[0] || 'Rider',
          rider_phone: '',
          lat: 28.6139 + (Math.random() - 0.5) * 0.01,
          lng: 77.2090 + (Math.random() - 0.5) * 0.01,
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
        <div className="flex gap-2">
          {(["today", "week", "month"] as const).map(p => (
            <button
              key={p}
              onClick={() => setDateFilter(p)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                dateFilter === p ? "bg-white text-[#0b50d5]" : "bg-white/10 text-white/70"
              }`}
            >
              {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </button>
          ))}
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
      <div className="px-4 py-3 flex gap-3 overflow-x-auto">
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm min-w-fit">
          <p className="text-[10px] text-slate-400">TODAY'S EARNINGS</p>
          <p className="font-black text-green-600">₹{todayEarnings}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm min-w-fit">
          <p className="text-[10px] text-slate-400">COMPLETED</p>
          <p className="font-black text-[#0b50d5]">{completedOrders.length}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm min-w-fit">
          <p className="text-[10px] text-slate-400">IN PROGRESS</p>
          <p className="font-black text-purple-600">{shoppingOrders.length}</p>
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
              <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded">{order.id}</span>
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
  const [items, setItems] = useState(order.items || []);
  const pickedCount = items.filter((i: any) => i.status === "picked").length;
  const totalSpent = items.reduce((s: number, i: any) => s + ((i.actual_price || 0) * i.quantity), 0);
  const profit = (order.total_amount || 0) + (order.delivery_fee || 0) - totalSpent;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-[#4d212a]">{order.vendor?.name}</h3>
          <p className="text-xs text-slate-400">{order.vendor?.address}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">location_on</span>
            Deliver: {order.address?.street}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-[#0b50d5]">₹{order.total_amount + (order.delivery_fee || 0)}</p>
          <p className="text-[10px] text-slate-400">Collect from customer</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
        <div className="h-full bg-green-500 transition-all" style={{ width: `${(pickedCount / items.length) * 100}%` }} />
      </div>
      <p className="text-xs text-slate-500 mb-3">{pickedCount}/{items.length} items picked</p>

      {/* Items List */}
      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
        {items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-sm">{item.quantity}x {item.menu_item?.name}</p>
              <p className="text-xs text-slate-400">Expected: ₹{item.unit_price}</p>
            </div>
            <select
              value={item.status || "pending"}
              onChange={(e) => onUpdateItemStatus(item.id, e.target.value, item.actual_price)}
              className={`text-xs font-bold px-2 py-1 rounded-full ${
                item.status === "picked" ? "bg-green-100 text-green-700" :
                item.status === "unavailable" ? "bg-red-100 text-red-700" :
                item.status === "different_brand" ? "bg-amber-100 text-amber-700" :
                "bg-slate-100 text-slate-500"
              }`}
            >
              <option value="pending">Pending</option>
              <option value="picked">✅ Available</option>
              <option value="unavailable">❌ Not Available</option>
              <option value="different_brand">🔄 Different Brand</option>
            </select>
            {item.status === "picked" && (
              <input
                type="number"
                placeholder="Price"
                value={item.actual_price || ""}
                onChange={(e) => onUpdateItemStatus(item.id, "picked", parseFloat(e.target.value))}
                className="w-16 text-xs border rounded px-1 py-1"
              />
            )}
          </div>
        ))}
      </div>

      {/* Barcode Scanner Button */}
      <button className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-sm font-bold mb-3 flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
        Scan Barcode (Optional)
      </button>

      {/* Financial Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg mb-3">
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

      {/* Actions */}
      <div className="flex gap-2">
        {pickedCount === items.length && onStartDelivery && (
          <button onClick={onStartDelivery} className="py-2 px-3 bg-[#0b50d5] text-white rounded-lg text-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">directions_bike</span>
            Start Delivery
          </button>
        )}
        {order.status === "on_the_way" && onShareLocation && (
          <button onClick={onShareLocation} className="py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">share_location</span>
            Share Live Location
          </button>
        )}
        <button onClick={onReportIssue} className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold">
          Report Issue
        </button>
        <button
          onClick={onMarkDelivered}
          disabled={pickedCount === 0}
          className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">payments</span>
          Complete & Collect ₹{order.total_amount + (order.delivery_fee || 0)}
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
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-white/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[3rem]">
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