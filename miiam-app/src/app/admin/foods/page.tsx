"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

interface FoodOrder {
  id: string;
  status: string;
  total_amount: number;
  placed_at: string;
  user_id?: string;
  payment_method?: string;
  delivery_fee?: number;
  special_instructions?: string;
  delivery_address?: string | null;
  delivery_address_id?: string | null;
  vendor?: { id?: string; name?: string; shop_name?: string; rating?: number } | null;
  items?: FoodOrderItem[];
  customer_name?: string;
  customer_profile?: { full_name: string | null; phone: string | null } | null;
  customer_address?: { street: string; city: string; state: string; postal_code: string; label?: string } | null;
}

interface FoodOrderItem {
  quantity: number;
  price: number;
  menu_item?: { name?: string } | null;
}

interface VendorRow {
  id: string;
  shop_name: string;
  name?: string;
}

export default function AdminFoodsDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [amountMin, setAmountMin] = useState<string>("");
  const [amountMax, setAmountMax] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "amount_high" | "amount_low" | "rating">("date");
  
  const [selectedOrder, setSelectedOrder] = useState<FoodOrder | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/food-orders?dateFilter=${dateFilter}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        logger.error({ err: new Error(err.error || `HTTP ${res.status}`) }, "Failed to load food orders");
        useToastStore.getState().addToast(`Failed to load orders: ${err.error || res.statusText}`, "error");
        setOrders([]);
        setVendors([]);
        setLoading(false);
        return;
      }
      const { orders: fetchedOrders, vendors: fetchedVendors } = await res.json();
      setOrders(fetchedOrders || []);
      setVendors(fetchedVendors || []);
    } catch (error) {
      logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Failed to load food orders");
      useToastStore.getState().addToast("Failed to load orders", "error");
      setOrders([]);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadData();

    const channel = supabase.channel("admin-foods-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData, supabase]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      const res = await fetch("/api/admin/food-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      useToastStore.getState().addToast(`Order status updated to ${newStatus}`, "success");
    } catch (error: unknown) {
      logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Error updating order");
      const msg = error instanceof Error ? error.message : "Unknown error";
      useToastStore.getState().addToast(`Failed to update: ${msg}`, "error");
      loadData();
    }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedOrders.length === 0) return;
    
    if (!confirm(`Update ${selectedOrders.length} orders to "${bulkStatus}"?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/food-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders, status: bulkStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      setOrders(orders.map(o => 
        selectedOrders.includes(o.id) ? { ...o, status: bulkStatus } : o
      ));
      useToastStore.getState().addToast(`${selectedOrders.length} orders updated!`, "success");
      setSelectedOrders([]);
      setBulkStatus("");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      useToastStore.getState().addToast(`Failed: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setVendorFilter("all");
    setPaymentFilter("all");
    setDateFilter("all");
    setAmountMin("");
    setAmountMax("");
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || vendorFilter !== "all" || 
    paymentFilter !== "all" || dateFilter !== "all" || amountMin || amountMax;

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.vendor?.name || order.vendor?.shop_name || "")?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesVendor = vendorFilter === "all" || order.vendor?.id === vendorFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_method === paymentFilter;
    
    const orderAmount = order.total_amount || 0;
    const matchesMinAmount = !amountMin || orderAmount >= parseFloat(amountMin);
    const matchesMaxAmount = !amountMax || orderAmount <= parseFloat(amountMax);
    
    return matchesSearch && matchesStatus && matchesVendor && matchesPayment && matchesMinAmount && matchesMaxAmount;
  }).sort((a, b) => {
    switch (sortBy) {
      case "amount_high": return (b.total_amount || 0) - (a.total_amount || 0);
      case "amount_low": return (a.total_amount || 0) - (b.total_amount || 0);
      case "rating": return ((b.vendor as { rating?: number })?.rating || 0) - ((a.vendor as { rating?: number })?.rating || 0);
      default: return new Date(b.placed_at || 0).getTime() - new Date(a.placed_at || 0).getTime();
    }
  });

  const totalGMV = filteredOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const activeOrders = filteredOrders.filter(o => !["delivered", "cancelled", "refunded"].includes(o.status)).length;
  const pendingOrders = filteredOrders.filter(o => o.status === "pending").length;
  const cancelledOrders = filteredOrders.filter(o => o.status === "cancelled").length;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    preparing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    shopping: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    picked_up: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    on_the_way: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  const statusBgColors: Record<string, string> = {
    pending: "#fef3c7",
    accepted: "#dbeafe",
    preparing: "#ede9fe",
    shopping: "#ffedd5",
    picked_up: "#e0e7ff",
    on_the_way: "#cffafe",
    delivered: "#dcfce7",
    cancelled: "#fee2e2",
    refunded: "#f3f4f6",
  };

  if (loading) return <div className="px-8">Loading foods dashboard...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Food Orders</h1>
        <div className="flex gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total GMV", value: `₹${totalGMV.toLocaleString()}`, icon: "payments", color: "text-green-600" },
          { label: "Active Orders", value: activeOrders, icon: "shopping_cart", color: "text-[var(--color-primary)]" },
          { label: "Pending", value: pendingOrders, icon: "schedule", color: "text-yellow-600" },
          { label: "Delivered", value: orders.filter(o => o.status === "delivered").length, icon: "check_circle", color: "text-green-600" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl shadow-sm border border-[var(--color-border-subtle)]">
            <div className={`w-10 h-10 rounded-xl bg-[var(--color-surface-subtle)] flex items-center justify-center mb-3 ${kpi.color}`}>
              <span className="material-symbols-outlined text-lg">{kpi.icon}</span>
            </div>
            <p className="text-[var(--color-outline-variant)] text-[10px] font-bold uppercase tracking-widest">{kpi.label}</p>
            <p className="text-xl font-black text-[var(--color-on-surface)]">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-50">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1">
              <h2 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm">Orders ({filteredOrders.length})</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-2 ${
                    showFilters || hasActiveFilters
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : "border-[var(--color-border-subtle)]"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                  Filters
                  {hasActiveFilters && <span className="bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] rounded-full w-5 h-5 text-xs flex items-center justify-center">!</span>}
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "amount_high" | "amount_low" | "rating")}
                  className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold"
                >
                  <option value="date">Sort: Date</option>
                  <option value="amount_high">Amount: High to Low</option>
                  <option value="amount_low">Amount: Low to High</option>
                  <option value="rating">Rating</option>
                </select>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order ID or vendor..."
                className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm"
              />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing</option>
              <option value="on_the_way">On the Way</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-[var(--color-surface-subtle)] rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-outline)] block mb-1">Vendor</label>
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg text-sm bg-[var(--color-surface-container-lowest)]"
                >
                  <option value="all">All Vendors</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.shop_name || v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-outline)] block mb-1">Payment Method</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg text-sm bg-[var(--color-surface-container-lowest)]"
                >
                  <option value="all">All Methods</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-outline)] block mb-1">Min Amount (₹)</label>
                <input
                  type="number"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg text-sm bg-[var(--color-surface-container-lowest)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-outline)] block mb-1">Max Amount (₹)</label>
                <input
                  type="number"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  placeholder="10000"
                  className="w-full px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg text-sm bg-[var(--color-surface-container-lowest)]"
                />
              </div>
            </div>
          )}
        </div>
        
        {selectedOrders.length > 0 && (
          <div className="p-4 bg-[var(--color-primary)]/10 border-b border-[var(--color-primary)]/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-[var(--color-primary)] text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
                {selectedOrders.length}
              </span>
              <span className="font-bold text-[var(--color-on-surface)]">orders selected</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold bg-[var(--color-surface-container-lowest)]"
              >
                <option value="">Change Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="on_the_way">On the Way</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={handleBulkUpdate}
                disabled={!bulkStatus}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                Apply
              </button>
              <button
                onClick={() => setSelectedOrders([])}
                className="px-4 py-2 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] rounded-xl font-bold text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest w-12">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Order ID</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Vendor</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Customer</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Items</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest text-right">Total</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Date</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[var(--color-outline-variant)]">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className={`hover:bg-[var(--color-surface-subtle)] transition-colors ${selectedOrders.includes(order.id) ? "bg-[var(--color-primary)]/5" : ""}`}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <span className="font-black text-[var(--color-on-surface)]">#{order.id?.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="p-4 text-[var(--color-on-surface-variant)]">{order.vendor?.name || order.vendor?.shop_name || "Unknown"}</td>
                    <td className="p-4">
                      <span className="font-bold text-[var(--color-on-surface)]">
                        {order.customer_profile?.full_name || order.customer_name || "Guest"}
                      </span>
                      {order.customer_profile?.phone && (
                        <p className="text-[10px] text-[var(--color-outline-variant)]">{order.customer_profile.phone}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id!, e.target.value)}
                        className="text-[10px] font-black px-2 py-1 rounded-full border-0 cursor-pointer bg-transparent text-[var(--color-on-surface)]"
                        style={{ backgroundColor: statusBgColors[order.status] || "var(--color-surface-container)" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="preparing">Preparing</option>
                        <option value="shopping">Shopping</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="on_the_way">On the Way</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="max-w-[180px] truncate text-[var(--color-outline)]">
                        {order.items && order.items.length > 0
                          ? order.items.map(item => `${item.quantity}x ${item.menu_item?.name || "Item"}`).join(", ")
                          : "0 items"}
                      </div>
                    </td>
                    <td className="p-4 text-right font-black text-[var(--color-on-surface)]">₹{(order.total_amount || 0).toFixed(0)}</td>
                    <td className="p-4 text-[var(--color-outline-variant)]">{order.placed_at ? new Date(order.placed_at).toLocaleDateString() : "-"}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {order.status === "pending" && (
                          <>
                            <button onClick={() => updateOrderStatus(order.id!, "accepted")} className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-100">Accept</button>
                            <button onClick={() => updateOrderStatus(order.id!, "cancelled")} className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100">Decline</button>
                          </>
                        )}
                        {order.status === "accepted" && (
                          <button onClick={() => updateOrderStatus(order.id!, "preparing")} className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold hover:bg-purple-100">Prepare</button>
                        )}
                        {order.status === "preparing" && (
                          <button onClick={() => updateOrderStatus(order.id!, "ready_for_pickup")} className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-bold hover:bg-orange-100">Ready</button>
                        )}
                        {(order.status === "ready_for_pickup" || order.status === "on_the_way" || order.status === "arrived") && (
                          <button onClick={() => updateOrderStatus(order.id!, "delivered")} className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-100">Delivered</button>
                        )}
                        <button onClick={() => setSelectedOrder(order)} className="text-[var(--color-primary)] font-bold hover:underline text-xs">View</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="food-order-title" onKeyDown={(e) => e.key === "Escape" && setSelectedOrder(null)}>
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 id="food-order-title" className="font-black text-lg">Order #{selectedOrder.id?.slice(0, 8).toUpperCase()}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-[var(--color-outline-variant)]" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Customer Details */}
              <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl space-y-3">
                <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Customer</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Name</p>
                    <p className="font-bold">{selectedOrder.customer_profile?.full_name || selectedOrder.customer_name || "Guest"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Phone</p>
                    <p className="font-bold">{selectedOrder.customer_profile?.phone || "—"}</p>
                  </div>
                  {selectedOrder.customer_address && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Delivery Address</p>
                      <p className="font-bold">{selectedOrder.customer_address.street}, {selectedOrder.customer_address.city}, {selectedOrder.customer_address.state} - {selectedOrder.customer_address.postal_code}</p>
                      {selectedOrder.customer_address.label && <p className="text-[10px] text-[var(--color-outline-variant)]">{selectedOrder.customer_address.label}</p>}
                    </div>
                  )}
                  {!selectedOrder.customer_address && selectedOrder.delivery_address && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Delivery Address</p>
                      <p className="font-bold">{selectedOrder.delivery_address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Vendor</p>
                  <p className="font-bold">{selectedOrder.vendor?.name || selectedOrder.vendor?.shop_name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Status</p>
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${statusColors[selectedOrder.status] || ""}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Total</p>
                  <p className="font-black text-lg">₹{selectedOrder.total_amount?.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Delivery Fee</p>
                  <p className="font-bold">₹{selectedOrder.delivery_fee?.toFixed(0) || 0}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-[var(--color-outline-variant)] uppercase mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm bg-[var(--color-surface-subtle)] p-2 rounded-lg">
                      <span>{item.quantity}x {item.menu_item?.name || "Item"}</span>
                      <span className="font-bold">₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedOrder.special_instructions && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 uppercase">Special Instructions</p>
                  <p className="text-sm">{selectedOrder.special_instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
