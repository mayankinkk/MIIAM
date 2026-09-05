"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "scheduled", "accepted", "processing", "preparing", "ready_for_pickup", "shopping", "picked_up", "picking_up", "on_the_way", "arrived", "delivered", "cancelled", "refunded", "no_rider_available"];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-indigo-100 text-indigo-700",
  accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  processing: "bg-indigo-100 text-indigo-700",
  preparing: "bg-purple-100 text-purple-700",
  ready_for_pickup: "bg-orange-100 text-orange-700",
  shopping: "bg-pink-100 text-pink-700",
  picked_up: "bg-pink-100 text-pink-700",
  picking_up: "bg-orange-100 text-orange-700",
  on_the_way: "bg-cyan-100 text-cyan-700",
  arrived: "bg-teal-100 text-teal-700",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  refunded: "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]",
  no_rider_available: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export default function OrderManagement() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [availableRiders, setAvailableRiders] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orderItems, setOrderItems] = useState<Record<string, { name: string; quantity: number; unit_price: number }[]>>({});
  const [customerProfile, setCustomerProfile] = useState<{ full_name: string | null; phone: string | null } | null>(null);
  const [customerAddress, setCustomerAddress] = useState<{ street: string; city: string; state: string; postal_code: string; label?: string } | null>(null);

  // Derived state for selected order items
  const selectedOrderItems = selectedOrder ? (orderItems[selectedOrder.id] || []) : [];

  useEffect(() => {
    loadOrders();

    const channel = supabase.channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      loadAvailableRiders();
      setSelectedRiderId("");
      // Use pre-fetched enriched data
      const cp = (selectedOrder as Order & { customer_profile?: { full_name: string | null; phone: string | null } | null }).customer_profile;
      const ca = (selectedOrder as Order & { customer_address?: { street: string; city: string; state: string; postal_code: string; label?: string } | null }).customer_address;
      setCustomerProfile(cp || null);
      setCustomerAddress(ca || null);
    } else {
      setCustomerProfile(null);
      setCustomerAddress(null);
    }
  }, [selectedOrder?.id]);

  async function loadAvailableRiders() {
    const { data } = await supabase
      .from("riders")
      .select("id, name, phone")
      .eq("is_online", true)
      .eq("verification_status", "verified");
    setAvailableRiders(data || []);
  }

  async function assignRider(orderId: string, riderId: string) {
    setAssigning(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ rider_id: riderId, status: "accepted" })
        .eq("id", orderId);
      if (error) throw error;
      useToastStore.getState().addToast("Rider assigned successfully", "success");
      setSelectedRiderId("");
      loadOrders();
      setSelectedOrder(null);
    } catch (err) {
      useToastStore.getState().addToast("Failed to assign rider", "error");
    } finally {
      setAssigning(false);
    }
  }

  async function loadOrders() {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        logger.error({ err: new Error(err.error || `HTTP ${res.status}`) }, "Failed to load admin orders");
        setLoading(false);
        return;
      }
      const { orders: fetchedOrders, orderItems: fetchedItems } = await res.json();
      setOrders(fetchedOrders || []);
      setOrderItems(fetchedItems || {});
    } catch (error) {
      logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Failed to load admin orders");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    // Fetch the order first to get user_id
    const { data: order } = await supabase.from("orders").select("user_id, vendor_id").eq("id", orderId).single();
    
    await supabase.from("orders").update({ status }).eq("id", orderId);
    
    // Send notification to customer
    if (order?.user_id) {
      const notifMap: Record<string, { title: string; body: string }> = {
        accepted: { title: "Order Accepted! 🎉", body: "Your order has been accepted and is being prepared." },
        preparing: { title: "Order Being Prepared 🍳", body: "Your order is being prepared right now!" },
        shopping: { title: "Rider is Shopping 🛒", body: "Your rider is shopping for your items at the store." },
        picking_up: { title: "Rider Heading to Vendor 🛵", body: "A rider is on their way to pick up your order." },
        on_the_way: { title: "Your Order is On the Way! 🚀", body: "Sit tight — your order is heading to you." },
        arrived: { title: "Rider Has Arrived! 📍", body: "Your rider has arrived at your location." },
        delivered: { title: "Order Delivered! ✅", body: "Your order has been delivered. Enjoy! Rate your experience in the app." },
        cancelled: { title: "Order Cancelled ❌", body: "Your order has been cancelled. Contact support if you need help." },
        refunded: { title: "Refund Processed 💰", body: "Your refund has been processed and will reflect shortly." },
      };
      const notif = notifMap[status];
      if (notif) {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: order.user_id, ...notif, type: "order" }),
        });
      }
    }
    
    loadOrders();
    setSelectedOrder(null);
  }

  async function refundOrder(orderId: string) {
    const { data: order } = await supabase.from("orders").select("user_id").eq("id", orderId).single();
    await supabase.from("orders").update({ status: "refunded" }).eq("id", orderId);
    if (order?.user_id) {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: order.user_id, title: "Refund Processed 💰", body: "Your refund has been processed and will reflect shortly.", type: "order" }),
      });
    }
    loadOrders();
    setSelectedOrder(null);
  }

  async function exportToCSV() {
    const headers = ["Order ID", "Vendor", "Status", "Total", "Delivery Fee", "Payment", "Placed At"];
    const rows = filteredOrders.map(o => [
      o.id.slice(0, 8),
      o.vendor?.name || "Unknown",
      o.status,
      o.total_amount,
      o.delivery_fee,
      o.payment_method,
      new Date(o.placed_at).toLocaleString()
    ]);
    const escapeCsv = (val: string | number) => {
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const csv = [headers, ...rows].map(r => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  function generateInvoice(order: Order) {
    const items = orderItems[order.id] || [];
    const subtotal = order.total_amount - order.delivery_fee;
    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    const itemsHtml = items.map(i => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px">${i.name}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center">${i.quantity}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right">₹${i.unit_price}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right">₹${i.unit_price * i.quantity}</td>
      </tr>
    `).join("");
    const html = `<!DOCTYPE html><html><head><title>Invoice #${order.id.slice(0,8)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:0;padding:40px;background:#fafafa;color:#1a1a1a}table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}.logo{font-size:24px;font-weight:800;color:#a40017}button{background:#a40017;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}button:hover{opacity:0.9}</style></head><body><div class="header"><div><div class="logo">MIIAM</div><p style="color:#666;margin:4px 0 0;font-size:13px">Order Invoice</p></div><button onclick="window.print()">Print Invoice</button></div><div style="display:flex;gap:24px;margin-bottom:24px"><div style="background:#fff;padding:16px 20px;border-radius:8px;flex:1;box-shadow:0 1px 3px rgba(0,0,0,0.08)"><p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;font-weight:700;letter-spacing:0.5px">Order ID</p><p style="margin:4px 0 0;font-size:15px;font-weight:700">#${order.id.slice(0,8)}</p></div><div style="background:#fff;padding:16px 20px;border-radius:8px;flex:1;box-shadow:0 1px 3px rgba(0,0,0,0.08)"><p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;font-weight:700;letter-spacing:0.5px">Date</p><p style="margin:4px 0 0;font-size:15px;font-weight:700">${new Date(order.placed_at).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</p></div><div style="background:#fff;padding:16px 20px;border-radius:8px;flex:1;box-shadow:0 1px 3px rgba(0,0,0,0.08)"><p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;font-weight:700;letter-spacing:0.5px">Vendor</p><p style="margin:4px 0 0;font-size:15px;font-weight:700">${order.vendor?.name || "N/A"}</p></div></div><table><thead><tr style="background:#f8f8f8"><th style="padding:12px 16px;text-align:left;font-size:11px;text-transform:uppercase;font-weight:700;color:#999;letter-spacing:0.5px">Item</th><th style="padding:12px 16px;text-align:center;font-size:11px;text-transform:uppercase;font-weight:700;color:#999;letter-spacing:0.5px">Qty</th><th style="padding:12px 16px;text-align:right;font-size:11px;text-transform:uppercase;font-weight:700;color:#999;letter-spacing:0.5px">Price</th><th style="padding:12px 16px;text-align:right;font-size:11px;text-transform:uppercase;font-weight:700;color:#999;letter-spacing:0.5px">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><div style="background:#fff;padding:20px;border-radius:8px;margin-top:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);max-width:320px;margin-left:auto"><div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#666"><span>Subtotal</span><span>₹${subtotal}</span></div><div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#666"><span>Delivery Fee</span><span>₹${order.delivery_fee}</span></div><div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#666"><span>GST (5%)</span><span>₹${gst}</span></div>${order.discount_amount>0?`<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#16a34a"><span>Discount</span><span>-₹${order.discount_amount}</span></div>`:""}<div style="display:flex;justify-content:space-between;padding-top:8px;border-top:2px solid #f0f0f0;font-size:16px;font-weight:800"><span>Total</span><span>₹${order.total_amount}</span></div></div><script>window.onafterprint=()=>window.close()</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  }

  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedIds(newSet);
  }

  async function bulkUpdateStatus(status: OrderStatus) {
    const notifMap: Record<string, { title: string; body: string }> = {
      accepted: { title: "Order Accepted! 🎉", body: "Your order has been accepted and is being prepared." },
      preparing: { title: "Order Being Prepared 🍳", body: "Your order is being prepared right now!" },
      on_the_way: { title: "Your Order is On the Way! 🚀", body: "Sit tight — your order is heading to you." },
      delivered: { title: "Order Delivered! ✅", body: "Your order has been delivered. Enjoy! Rate your experience in the app." },
      cancelled: { title: "Order Cancelled ❌", body: "Your order has been cancelled. Contact support if you need help." },
      refunded: { title: "Refund Processed 💰", body: "Your refund has been processed and will reflect shortly." },
    };
    const notif = notifMap[status];

    await Promise.all(
      Array.from(selectedIds).map(async (id) => {
        const { data: order } = await supabase.from("orders").select("user_id").eq("id", id).single();
        await supabase.from("orders").update({ status }).eq("id", id);
        if (order?.user_id && notif) {
          try {
            await fetch("/api/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: order.user_id, ...notif, type: "order" }),
            });
          } catch (e) {
            logger.warn({ err: e instanceof Error ? e : new Error(String(e)) }, "[admin-orders] Failed to send bulk notification");
          }
        }
      })
    );
    setSelectedIds(new Set());
    loadOrders();
  }

  const filteredOrders = orders.filter(o => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search && !o.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(o.placed_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(o.placed_at) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total_amount, 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  if (loading) return <div className="px-8">Loading orders...</div>;

  return (
    <div className="px-8 space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl shadow-sm border border-[var(--color-border-subtle)]">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Total Orders</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{orders.length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl shadow-sm border border-[var(--color-border-subtle)]">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Revenue</p>
          <p className="text-3xl font-black text-green-600">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl shadow-sm border border-[var(--color-border-subtle)]">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Pending</p>
          <p className="text-3xl font-black text-yellow-600">{pendingOrders}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl shadow-sm border border-[var(--color-border-subtle)]">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Avg Order</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">₹{(() => { const delivered = orders.filter(o => o.status === "delivered").length; return delivered > 0 ? Math.round(totalRevenue / delivered) : 0; })()}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-[var(--color-outline-variant)] text-sm">search</span>
              <input
                type="text"
                placeholder="Search order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search orders"
                className="bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as OrderStatus | "all")}
              aria-label="Filter by status"
              className="bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2 text-sm focus:outline-none"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replaceAll("_", " ")}</option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="Filter orders from date"
              className="bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2 text-sm focus:outline-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="Filter orders to date"
              className="bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2 text-sm focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <>
                <span className="text-xs font-bold text-[var(--color-outline-variant)] self-center">{selectedIds.size} selected</span>
                {["accepted", "cancelled"].map(s => (
                  <button
                    key={s}
                    onClick={() => bulkUpdateStatus(s as OrderStatus)}
                    className="px-4 py-2 bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] rounded-xl text-xs font-bold hover:bg-[var(--color-surface-container-high)]"
                  >
                    Mark {s}
                  </button>
                ))}
              </>
            )}
<button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Order Management</caption>
            <thead className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-border-subtle)]">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-[var(--color-primary)]"
                  />
                </th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Order ID</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Customer</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Vendor</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Items</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest text-right">Total</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Placed</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filteredOrders.map((order) => {
                const items = orderItems[order.id] || [];
                const cp = (order as Order & { customer_profile?: { full_name: string | null; phone: string | null } | null }).customer_profile;
                return (
                <tr key={order.id} className="hover:bg-[var(--color-surface-subtle)]/50 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="w-4 h-4 accent-[var(--color-primary)]"
                    />
                  </td>
                  <td className="p-4">
                    <button onClick={() => setSelectedOrder(order)} className="font-mono text-xs font-bold text-[var(--color-primary)] hover:underline">
                      #{order.id.slice(0, 8)}
                    </button>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-[var(--color-on-surface)]">{cp?.full_name || order.customer_name || "Guest"}</p>
                    {cp?.phone && <p className="text-[10px] text-[var(--color-outline-variant)]">{cp.phone}</p>}
                  </td>
                  <td className="p-4 text-sm font-medium text-[var(--color-on-surface-variant)]">{order.vendor?.name || "Unknown"}</td>
                  <td className="p-4 text-xs text-[var(--color-outline)] max-w-[180px] truncate">
                    {items.map(i => `${i.quantity}x ${i.name}`).join(", ") || "—"}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${STATUS_COLORS[order.status]}`}>
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-[var(--color-on-surface)]">₹{order.total_amount}</td>
                  <td className="p-4 text-right text-xs text-[var(--color-outline-variant)]">
                    {new Date(order.placed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {order.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(order.id, "accepted")} className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-100">Accept</button>
                          <button onClick={() => updateStatus(order.id, "cancelled")} className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100">Decline</button>
                        </>
                      )}
                      {order.status === "accepted" && (
                        <button onClick={() => updateStatus(order.id, "preparing")} className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold hover:bg-purple-100">Prepare</button>
                      )}
                      {order.status === "preparing" && (
                        <button onClick={() => updateStatus(order.id, "ready_for_pickup")} className="px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-bold hover:bg-orange-100">Ready</button>
                      )}
                      {(order.status === "ready_for_pickup" || order.status === "on_the_way" || order.status === "arrived") && (
                        <button onClick={() => updateStatus(order.id, "delivered")} className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-100">Delivered</button>
                      )}
                      <button onClick={() => setSelectedOrder(order)} className="text-[var(--color-outline-variant)] hover:text-[var(--color-primary)] p-1" aria-label={`View order ${order.id.slice(0, 8)}`}>
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-50 text-xs text-[var(--color-outline-variant)]">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="order-detail-title" onKeyDown={(e) => e.key === "Escape" && setSelectedOrder(null)}>
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--color-border-subtle)] flex justify-between items-center sticky top-0 bg-[var(--color-surface-container-lowest)]">
              <div>
                <h2 id="order-detail-title" className="text-xl font-black text-[var(--color-on-surface)]">Order #{selectedOrder.id.slice(0, 8)}</h2>
                <p className="text-xs text-[var(--color-outline-variant)]">{new Date(selectedOrder.placed_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)] p-2" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
                <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Customer Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-outline-variant)]">Name</p>
                    <p className="font-bold text-[var(--color-on-surface)]">
                      {customerProfile?.full_name || selectedOrder.customer_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-outline-variant)]">Phone</p>
                    <p className="font-bold text-[var(--color-on-surface)]">
                      {customerProfile?.phone || "—"}
                    </p>
                  </div>
                  <div className="col-span-2" style={{ display: customerAddress ? 'block' : 'none' }}>
                    <p className="text-xs text-[var(--color-outline-variant)]">Delivery Address</p>
                    <p className="font-bold text-[var(--color-on-surface)]">
                      {customerAddress?.street}, {customerAddress?.city}, {customerAddress?.state} - {customerAddress?.postal_code}
                    </p>
                    {customerAddress?.label && (
                      <p className="text-xs text-[var(--color-outline-variant)] mt-1">{customerAddress.label}</p>
                    )}
                  </div>
                  <div className="col-span-2" style={{ display: !customerAddress && selectedOrder.delivery_address ? 'block' : 'none' }}>
                    <p className="text-xs text-[var(--color-outline-variant)]">Delivery Address</p>
                    <p className="font-bold text-[var(--color-on-surface)]">{selectedOrder.delivery_address}</p>
                  </div>
                  <div className="col-span-2" style={{ display: !customerAddress && !selectedOrder.delivery_address ? 'block' : 'none' }}>
                    <p className="text-xs text-[var(--color-outline-variant)]">Delivery Address</p>
                    <p className="text-[var(--color-outline-variant)]">—</p>
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl">
                  <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase mb-1">Vendor</p>
                  <p className="font-bold text-[var(--color-on-surface)]">{selectedOrder.vendor?.name}</p>
                </div>
                <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl">
                  <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase mb-1">Rider</p>
                  <p className="font-bold text-[var(--color-on-surface)]">{selectedOrder.rider?.name || "Not Assigned"}</p>
                  {selectedOrder.rider?.phone && <p className="text-xs text-[var(--color-outline)]">{selectedOrder.rider.phone}</p>}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl space-y-2">
                <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase mb-2">Items Ordered</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedOrderItems.map((i) => (
                    <div key={i.name} className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)]">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[var(--color-on-surface-variant)] text-sm">×{i.quantity}</span>
                        <span className="text-[var(--color-on-surface)]">{i.name}</span>
                      </div>
                      <span className="font-bold text-[var(--color-on-surface)]">₹{i.unit_price * i.quantity}</span>
                    </div>
                  ))}
                  {selectedOrderItems.length === 0 && (
                    <p className="text-[var(--color-outline-variant)] text-center py-4">No items found</p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-on-surface-variant)]">Subtotal</span>
                  <span className="text-sm font-bold">₹{selectedOrder.total_amount - selectedOrder.delivery_fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-on-surface-variant)]">Delivery Fee</span>
                  <span className="text-sm font-bold">₹{selectedOrder.delivery_fee}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">Discount</span>
                    <span className="text-sm font-bold">-₹{selectedOrder.discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[var(--color-border-subtle)] pt-2">
                  <span className="font-bold text-[var(--color-on-surface)]">Total</span>
                  <span className="font-black text-lg">₹{selectedOrder.total_amount}</span>
                </div>
              </div>
              {/* Status Management */}
              <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl">
                <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.filter(s => s !== selectedOrder.status && s !== "refunded").map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedOrder.id, s)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${STATUS_COLORS[s]} hover:opacity-80`}
                    >
                      → {s.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
              {(selectedOrder.status === "pending" || selectedOrder.status === "no_rider_available") && (
                <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl">
                  <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase mb-3">Assign Rider</p>
                  {selectedOrder.rider ? (
                    <div className="flex items-center gap-3 mb-3 p-3 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)]">
                      <span className="material-symbols-outlined text-[var(--color-primary)]">person</span>
                      <div>
                        <p className="font-bold text-[var(--color-on-surface)]">{selectedOrder.rider.name}</p>
                        {selectedOrder.rider.phone && <p className="text-xs text-[var(--color-outline)]">{selectedOrder.rider.phone}</p>}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <select
                      value={selectedRiderId}
                      onChange={(e) => setSelectedRiderId(e.target.value)}
                      aria-label="Select rider"
                      className="flex-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10"
                    >
                      <option value="">Select a rider...</option>
                      {availableRiders.map((rider) => (
                        <option key={rider.id} value={rider.id}>{rider.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => selectedRiderId && assignRider(selectedOrder.id, selectedRiderId)}
                      disabled={!selectedRiderId || assigning}
                      className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50"
                    >
                      {assigning ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => generateInvoice(selectedOrder)}
                  className="flex-1 py-3 bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] rounded-xl font-bold text-sm hover:bg-[var(--color-surface-container-high)] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">receipt_long</span>
                  Invoice
                </button>
                {selectedOrder.status === "cancelled" && (
                  <button
                    onClick={() => refundOrder(selectedOrder.id)}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
                  >
                    Refund Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}