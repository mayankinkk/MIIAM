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
  status: string;
  total_amount: number;
  delivery_fee: number;
  special_instructions: string | null;
  placed_at: string;
  vendor?: {
    name: string;
    address: string;
    phone: string;
  };
  address?: {
    street: string;
    city: string;
  };
  items?: OrderItem[];
}

const STATUS_FLOW = ["pending", "accepted", "picking_up", "shopping", "on_the_way", "delivered"];

export default function RiderOrdersPage() {
  const supabase = createClient();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "shopping" | "completed">("available");

  useEffect(() => {
    loadOrders();
  }, [supabase]);

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*, vendor:vendors(*), address:delivery_address_id(*), items:order_items(*, menu_item:menu_items(*))")
      .in("status", ["preparing", "picking_up", "shopping"])
      .order("placed_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  async function acceptOrder(orderId: string) {
    await supabase.from("orders").update({ status: "picking_up", rider_id: "current-rider" }).eq("id", orderId);
    loadOrders();
  }

  if (loading) return <div className="p-6">Loading orders...</div>;

  const availableOrders = orders.filter(o => o.status === "preparing");
  const shoppingOrders = orders.filter(o => ["picking_up", "shopping"].includes(o.status));
  const completedOrders = orders.filter(o => o.status === "delivered");

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-[#0b50d5] text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider" className="text-3xl font-black tracking-tighter">MIIAM</Link>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">person</span>
          </div>
        </div>
        <div className="flex gap-2 mt-6 bg-white/10 p-1 rounded-xl">
          {(["available", "shopping", "completed"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize ${
                activeTab === tab ? "bg-white text-[#0b50d5]" : "text-white/70"
              }`}
            >
              {tab} {tab === "available" ? `(${availableOrders.length})` : tab === "shopping" ? `(${shoppingOrders.length})` : `(${completedOrders.length})`}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6 space-y-4 pb-32">
        {activeTab === "available" && (
          <>
            <h2 className="text-xl font-bold text-[#4d212a] mb-4">Available Orders to Shop</h2>
            {availableOrders.map(order => (
              <OrderCard key={order.id} order={order} onAccept={() => acceptOrder(order.id)} />
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
            <h2 className="text-xl font-bold text-[#4d212a] mb-4">Your Shopping List</h2>
            {shoppingOrders.map(order => (
              <ShoppingCard key={order.id} order={order} onRefresh={loadOrders} />
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
            <h2 className="text-xl font-bold text-[#4d212a] mb-4">Completed Deliveries</h2>
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
      </main>

      {/* Bottom Nav */}
      <RiderNavBar active="orders" />
    </div>
  );
}

function OrderCard({ order, onAccept }: { order: any; onAccept: () => void }) {
  const totalItems = order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-[#4d212a]">{order.vendor?.name}</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">store</span>
            {order.vendor?.address}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-green-600">₹{order.total_amount}</p>
          <p className="text-[10px] text-slate-400">{totalItems} items</p>
        </div>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 mb-3">
        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Items to buy:</p>
        {order.items?.slice(0, 3).map((item: any) => (
          <p key={item.id} className="text-sm text-slate-600">
            {item.quantity}x {item.menu_item?.name}
          </p>
        ))}
        {order.items?.length > 3 && (
          <p className="text-xs text-slate-400">+{order.items.length - 3} more items</p>
        )}
      </div>
      <button
        onClick={onAccept}
        className="w-full bg-[#0b50d5] text-white py-3 rounded-xl font-bold hover:bg-[#0044bf]"
      >
        Start Shopping
      </button>
    </div>
  );
}

function ShoppingCard({ order, onRefresh }: { order: any; onRefresh: () => void }) {
  const router = useRouter();
  const [items, setItems] = useState(order.items || []);
  const [expanded, setExpanded] = useState(false);

  async function updateItemStatus(itemId: string, status: string) {
    const supabase = createClient();
    await supabase.from("order_items").update({ status, picked: status === "picked" }).eq("id", itemId);
    setItems(items.map((i: any) => i.id === itemId ? { ...i, status } : i));
  }

  async function updateActualPrice(itemId: string, price: string) {
    const supabase = createClient();
    await supabase.from("order_items").update({ actual_price: parseFloat(price) }).eq("id", itemId);
    setItems(items.map((i: any) => i.id === itemId ? { ...i, actual_price: parseFloat(price) } : i));
  }

  async function startShopping() {
    const supabase = createClient();
    await supabase.from("orders").update({ status: "shopping" }).eq("id", order.id);
    onRefresh();
  }

  async function markDelivered() {
    const supabase = createClient();
    await supabase.from("orders").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", order.id);
    onRefresh();
  }

  const pickedCount = items.filter((i: any) => i.status === "picked").length;
  const totalActual = items.reduce((s: number, i: any) => s + (i.actual_price || 0) * i.quantity, 0);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-[#4d212a]">{order.vendor?.name}</h3>
          <p className="text-xs text-slate-400">{order.vendor?.address}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-sm">location_on</span>
            Deliver to: {order.address?.street}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-[#0b50d5]">₹{order.total_amount}</p>
          <p className="text-[10px] text-slate-400">Customer paid</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all" 
          style={{ width: `${(pickedCount / items.length) * 100}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mb-4">{pickedCount}/{items.length} items picked</p>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
            <div className="flex-1">
              <p className="font-medium text-sm">{item.quantity}x {item.menu_item?.name}</p>
              <p className="text-xs text-slate-400">{item.menu_item?.category}</p>
            </div>
            <select
              value={item.status || "pending"}
              onChange={(e) => updateItemStatus(item.id, e.target.value)}
              className={`text-xs font-bold px-2 py-1 rounded-full ${
                item.status === "picked" ? "bg-green-100 text-green-700" :
                item.status === "unavailable" ? "bg-red-100 text-red-700" :
                item.status === "different_brand" ? "bg-amber-100 text-amber-700" :
                "bg-slate-100 text-slate-500"
              }`}
            >
              <option value="pending">Pending</option>
              <option value="picked">Available ✅</option>
              <option value="unavailable">Not Available ❌</option>
              <option value="different_brand">Diff Brand 🔄</option>
            </select>
            {item.status === "picked" && (
              <input
                type="number"
                placeholder="Price"
                value={item.actual_price || ""}
                onChange={(e) => updateActualPrice(item.id, e.target.value)}
                className="w-20 text-sm border rounded-lg px-2 py-1"
              />
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex justify-between text-sm mb-4 p-3 bg-slate-50 rounded-xl">
        <span>Your advance used:</span>
        <span className="font-bold">₹{totalActual.toFixed(2)}</span>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {order.status === "picking_up" ? (
          <button
            onClick={startShopping}
            className="w-full bg-[#0b50d5] text-white py-3 rounded-xl font-bold"
          >
            Start Shopping
          </button>
        ) : (
          <button
            onClick={markDelivered}
            disabled={pickedCount === 0}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            Mark Delivered (₹{totalActual.toFixed(2)} collected)
          </button>
        )}
      </div>
    </div>
  );
}

function CompletedCard({ order }: { order: any }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg opacity-75">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-[#4d212a]">{order.vendor?.name}</h3>
          <p className="text-xs text-slate-400">
            {new Date(order.delivered_at).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-green-600">₹{order.total_amount}</p>
          <p className="text-[10px] text-green-500">Delivered ✅</p>
        </div>
      </div>
    </div>
  );
}

function RiderNavBar({ active }: { active: string }) {
  const navItems = [
    { name: "Map", href: "/rider", icon: "map" },
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