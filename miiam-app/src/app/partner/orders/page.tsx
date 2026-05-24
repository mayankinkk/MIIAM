"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";

type FilterStatus = "all" | "active" | "delivered" | "cancelled";

export default function VendorOrders() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (vendor) {
      setVendorId(vendor.id);
      loadOrders(vendor.id);
    }
    setLoading(false);
  }

  async function loadOrders(vId: string) {
    const { data } = await supabase
      .from("orders")
      .select("*, items:order_items(*, menu_item:menu_items(name))")
      .eq("vendor_id", vId)
      .order("placed_at", { ascending: false });
    if (data) setOrders(data);
  }

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
    if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status });
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      search === "" ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.delivery_address || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && !["delivered", "cancelled", "refunded"].includes(o.status)) ||
      (filter === "delivered" && o.status === "delivered") ||
      (filter === "cancelled" && ["cancelled", "refunded"].includes(o.status));
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: orders.length,
    active: orders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => ["cancelled", "refunded"].includes(o.status)).length,
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order Management</h1>
        <p className="text-slate-500 mt-1">View and manage all your orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { key: "all", label: "Total", color: "text-slate-900" },
          { key: "active", label: "Active", color: "text-[#ba001c]" },
          { key: "delivered", label: "Delivered", color: "text-green-600" },
          { key: "cancelled", label: "Cancelled", color: "text-red-600" },
        ] as const).map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`bg-white p-5 rounded-2xl border text-left transition-all ${
              filter === s.key ? "border-[#ba001c] shadow-sm" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="text-sm text-slate-500 font-medium">{s.label}</p>
            <p className={`text-3xl font-black ${s.color} mt-1`}>{statusCounts[s.key]}</p>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or address..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#ba001c]"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "delivered", "cancelled"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400 font-medium animate-pulse">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">receipt_long</span>
            <p className="text-slate-400 font-medium text-lg">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-extrabold text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      order.status === "pending" ? "bg-amber-100 text-amber-700" :
                      order.status === "accepted" ? "bg-blue-100 text-blue-700" :
                      order.status === "preparing" ? "bg-indigo-100 text-indigo-700" :
                      order.status === "delivered" ? "bg-green-100 text-green-700" :
                      order.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>{order.items?.length || 0} items</span>
                    <span>{new Date(order.placed_at).toLocaleDateString()} {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {order.delivery_address && <span className="truncate max-w-[200px]">{order.delivery_address}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {order.items?.slice(0, 4).map((item, i) => (
                      <span key={i} className="text-xs bg-slate-50 px-2 py-1 rounded-full text-slate-600">
                        {item.quantity}x {item.menu_item?.name || "Item"}
                      </span>
                    ))}
                    {(order.items?.length || 0) > 4 && (
                      <span className="text-xs text-slate-400">+{order.items!.length - 4} more</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:text-right">
                  <div>
                    <p className="text-xl font-black text-[#ba001c]">₹{order.total_amount.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">{order.payment_method}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {selectedOrder?.id === order.id ? "Close" : "Manage"}
                  </button>
                </div>
              </div>

              {/* Expanded Management Panel */}
              {selectedOrder?.id === order.id && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-2">Order Items</h4>
                      <div className="space-y-2 bg-slate-50 p-4 rounded-xl">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-slate-700">
                              <span className="text-slate-400 mr-1">{item.quantity}x</span>
                              {item.menu_item?.name || "Item"}
                            </span>
                            <span className="font-bold text-slate-800">₹{(item.unit_price * item.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                          <span className="font-bold text-slate-700">Total</span>
                          <span className="font-bold text-[#ba001c]">₹{order.total_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {order.special_instructions && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-slate-700 mb-1">Special Instructions</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{order.special_instructions}</p>
                        </div>
                      )}
                      {order.delivery_address && (
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-1">Delivery Address</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{order.delivery_address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {order.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(order.id, "accepted")} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors">Accept</button>
                        <button onClick={() => updateStatus(order.id, "cancelled")} className="px-6 py-3 border border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">Decline</button>
                      </>
                    )}
                    {order.status === "accepted" && (
                      <button onClick={() => updateStatus(order.id, "preparing")} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors">Start Preparing</button>
                    )}
                    {order.status === "preparing" && (
                      <button onClick={() => updateStatus(order.id, "picking_up")} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">Mark Ready</button>
                    )}
                    {order.status === "picking_up" && (
                      <button onClick={() => updateStatus(order.id, "on_the_way")} className="px-6 py-3 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a40017] transition-colors">Hand to Rider</button>
                    )}
                    {order.status === "on_the_way" && (
                      <button onClick={() => updateStatus(order.id, "delivered")} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors">Mark Delivered</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
