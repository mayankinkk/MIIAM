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
  customer_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    label?: string;
  } | null;
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
        logger.error(
          { err: new Error(err.error || `HTTP ${res.status}`) },
          "Failed to load food orders"
        );
        useToastStore
          .getState()
          .addToast(`Failed to load orders: ${err.error || res.statusText}`, "error");
        setOrders([]);
        setVendors([]);
        setLoading(false);
        return;
      }
      const { orders: fetchedOrders, vendors: fetchedVendors } = await res.json();
      setOrders(fetchedOrders || []);
      setVendors(fetchedVendors || []);
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Failed to load food orders"
      );
      useToastStore.getState().addToast("Failed to load orders", "error");
      setOrders([]);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("admin-foods-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, supabase]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

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
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Error updating order"
      );
      const msg = error instanceof Error ? error.message : "Unknown error";
      useToastStore.getState().addToast(`Failed to update: ${msg}`, "error");
      loadData();
    }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
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

      setOrders(
        orders.map((o) => (selectedOrders.includes(o.id) ? { ...o, status: bulkStatus } : o))
      );
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

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    vendorFilter !== "all" ||
    paymentFilter !== "all" ||
    dateFilter !== "all" ||
    amountMin ||
    amountMax;

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.vendor?.name || order.vendor?.shop_name || "")
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesVendor = vendorFilter === "all" || order.vendor?.id === vendorFilter;
      const matchesPayment = paymentFilter === "all" || order.payment_method === paymentFilter;

      const orderAmount = order.total_amount || 0;
      const matchesMinAmount = !amountMin || orderAmount >= parseFloat(amountMin);
      const matchesMaxAmount = !amountMax || orderAmount <= parseFloat(amountMax);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesVendor &&
        matchesPayment &&
        matchesMinAmount &&
        matchesMaxAmount
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "amount_high":
          return (b.total_amount || 0) - (a.total_amount || 0);
        case "amount_low":
          return (a.total_amount || 0) - (b.total_amount || 0);
        case "rating":
          return (
            ((b.vendor as { rating?: number })?.rating || 0) -
            ((a.vendor as { rating?: number })?.rating || 0)
          );
        default:
          return new Date(b.placed_at || 0).getTime() - new Date(a.placed_at || 0).getTime();
      }
    });

  const totalGMV = filteredOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const activeOrders = filteredOrders.filter(
    (o) => !["delivered", "cancelled", "refunded"].includes(o.status)
  ).length;
  const pendingOrders = filteredOrders.filter((o) => o.status === "pending").length;
  const cancelledOrders = filteredOrders.filter((o) => o.status === "cancelled").length;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    accepted: "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal",
    preparing: "bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent",
    shopping: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    picked_up: "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal",
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
    <div className="space-y-8 px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Food Orders</h1>
        <div className="flex gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-bold"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Total GMV",
            value: `₹${totalGMV.toLocaleString()}`,
            icon: "payments",
            color: "text-green-600",
          },
          {
            label: "Active Orders",
            value: activeOrders,
            icon: "shopping_cart",
            color: "text-[var(--color-primary)]",
          },
          { label: "Pending", value: pendingOrders, icon: "schedule", color: "text-yellow-600" },
          {
            label: "Delivered",
            value: orders.filter((o) => o.status === "delivered").length,
            icon: "check_circle",
            color: "text-green-600",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-subtle)] ${kpi.color}`}
            >
              <span className="material-symbols-outlined text-lg">{kpi.icon}</span>
            </div>
            <p className="text-[10px] font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
              {kpi.label}
            </p>
            <p className="text-xl font-black text-[var(--color-on-surface)]">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="border-b border-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <h2 className="text-sm font-black tracking-widest text-[var(--color-on-surface)] uppercase">
                Orders ({filteredOrders.length})
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${
                  showFilters || hasActiveFilters
                    ? "text-on-primary border-[var(--color-primary)] bg-[var(--color-primary)]"
                    : "border-[var(--color-border-subtle)]"
                }`}
              >
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Filters
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)] text-xs text-[var(--color-primary)]">
                    !
                  </span>
                )}
              </button>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "date" | "amount_high" | "amount_low" | "rating")
                }
                className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-bold"
              >
                <option value="date">Sort: Date</option>
                <option value="amount_high">Amount: High to Low</option>
                <option value="amount_low">Amount: Low to High</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order ID or vendor..."
                className="w-full rounded-xl border border-[var(--color-border-subtle)] py-2 pr-4 pl-10 text-sm"
              />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-bold"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-bold"
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
            <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-[var(--color-surface-subtle)] p-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-outline)]">
                  Vendor
                </label>
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-sm"
                >
                  <option value="all">All Vendors</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.shop_name || v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-outline)]">
                  Payment Method
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-sm"
                >
                  <option value="all">All Methods</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-outline)]">
                  Min Amount (₹)
                </label>
                <input
                  type="number"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-outline)]">
                  Max Amount (₹)
                </label>
                <input
                  type="number"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  placeholder="10000"
                  className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {selectedOrders.length > 0 && (
          <div className="flex items-center justify-between gap-4 border-b border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-4">
            <div className="flex items-center gap-3">
              <span className="text-on-primary flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-black">
                {selectedOrders.length}
              </span>
              <span className="font-bold text-[var(--color-on-surface)]">orders selected</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-4 py-2 text-sm font-bold"
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
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Apply
              </button>
              <button
                onClick={() => setSelectedOrders([])}
                className="rounded-xl bg-[var(--color-surface-container-high)] px-4 py-2 text-sm font-bold text-[var(--color-on-surface-variant)]"
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
                <th className="w-12 p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrders.length === filteredOrders.length && filteredOrders.length > 0
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Order ID
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Vendor
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Customer
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Status
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Items
                </th>
                <th className="p-4 text-right text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Total
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Date
                </th>
                <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Actions
                </th>
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
                  <tr
                    key={order.id}
                    className={`transition-colors hover:bg-[var(--color-surface-subtle)] ${selectedOrders.includes(order.id) ? "bg-[var(--color-primary)]/5" : ""}`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <span className="font-black text-[var(--color-on-surface)]">
                        #{order.id?.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--color-on-surface-variant)]">
                      {order.vendor?.name || order.vendor?.shop_name || "Unknown"}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-[var(--color-on-surface)]">
                        {order.customer_profile?.full_name || order.customer_name || "Guest"}
                      </span>
                      {order.customer_profile?.phone && (
                        <p className="text-[10px] text-[var(--color-outline-variant)]">
                          {order.customer_profile.phone}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id!, e.target.value)}
                        className="cursor-pointer rounded-full border-0 bg-transparent px-2 py-1 text-[10px] font-black text-[var(--color-on-surface)]"
                        style={{
                          backgroundColor:
                            statusBgColors[order.status] || "var(--color-surface-container)",
                        }}
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
                          ? order.items
                              .map((item) => `${item.quantity}x ${item.menu_item?.name || "Item"}`)
                              .join(", ")
                          : "0 items"}
                      </div>
                    </td>
                    <td className="p-4 text-right font-black text-[var(--color-on-surface)]">
                      ₹{(order.total_amount || 0).toFixed(0)}
                    </td>
                    <td className="p-4 text-[var(--color-outline-variant)]">
                      {order.placed_at ? new Date(order.placed_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id!, "accepted")}
                              className="rounded-lg bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600 hover:bg-green-100"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id!, "cancelled")}
                              className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {order.status === "accepted" && (
                          <button
                            onClick={() => updateOrderStatus(order.id!, "preparing")}
                            className="bg-accent/10 text-accent hover:bg-accent/20 rounded-lg px-2 py-1 text-[10px] font-bold"
                          >
                            Prepare
                          </button>
                        )}
                        {order.status === "preparing" && (
                          <button
                            onClick={() => updateOrderStatus(order.id!, "ready_for_pickup")}
                            className="rounded-lg bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600 hover:bg-orange-100"
                          >
                            Ready
                          </button>
                        )}
                        {(order.status === "ready_for_pickup" ||
                          order.status === "on_the_way" ||
                          order.status === "arrived") && (
                          <button
                            onClick={() => updateOrderStatus(order.id!, "delivered")}
                            className="rounded-lg bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600 hover:bg-green-100"
                          >
                            Delivered
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                        >
                          View
                        </button>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="food-order-title"
          onKeyDown={(e) => e.key === "Escape" && setSelectedOrder(null)}
        >
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--color-surface-container-lowest)]">
            <div className="flex items-center justify-between border-b p-6">
              <h2 id="food-order-title" className="text-lg font-black">
                Order #{selectedOrder.id?.slice(0, 8).toUpperCase()}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[var(--color-outline-variant)]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 p-6">
              {/* Customer Details */}
              <div className="space-y-3 rounded-xl bg-[var(--color-surface-subtle)] p-4">
                <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                  Customer
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                      Name
                    </p>
                    <p className="font-bold">
                      {selectedOrder.customer_profile?.full_name ||
                        selectedOrder.customer_name ||
                        "Guest"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                      Phone
                    </p>
                    <p className="font-bold">{selectedOrder.customer_profile?.phone || "—"}</p>
                  </div>
                  {selectedOrder.customer_address && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                        Delivery Address
                      </p>
                      <p className="font-bold">
                        {selectedOrder.customer_address.street},{" "}
                        {selectedOrder.customer_address.city},{" "}
                        {selectedOrder.customer_address.state} -{" "}
                        {selectedOrder.customer_address.postal_code}
                      </p>
                      {selectedOrder.customer_address.label && (
                        <p className="text-[10px] text-[var(--color-outline-variant)]">
                          {selectedOrder.customer_address.label}
                        </p>
                      )}
                    </div>
                  )}
                  {!selectedOrder.customer_address && selectedOrder.delivery_address && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                        Delivery Address
                      </p>
                      <p className="font-bold">{selectedOrder.delivery_address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                    Vendor
                  </p>
                  <p className="font-bold">
                    {selectedOrder.vendor?.name || selectedOrder.vendor?.shop_name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                    Status
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-black ${statusColors[selectedOrder.status] || ""}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Total</p>
                  <p className="text-lg font-black">₹{selectedOrder.total_amount?.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                    Delivery Fee
                  </p>
                  <p className="font-bold">₹{selectedOrder.delivery_fee?.toFixed(0) || 0}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] text-[var(--color-outline-variant)] uppercase">
                  Items
                </p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between rounded-lg bg-[var(--color-surface-subtle)] p-2 text-sm"
                    >
                      <span>
                        {item.quantity}x {item.menu_item?.name || "Item"}
                      </span>
                      <span className="font-bold">₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedOrder.special_instructions && (
                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                  <p className="text-[10px] text-amber-700 uppercase dark:text-amber-300">
                    Special Instructions
                  </p>
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
