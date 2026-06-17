"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { getVendorForUser, getVendorMenuItems } from "@/lib/vendor";
import type { Order } from "@/lib/types";

export default function VendorDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const { confirm } = useConfirm();
  const [vendor, setVendor] = useState<{ id: string; shop_name: string; status: string; rating: number; review_count: number; type?: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [menuItemNames, setMenuItemNames] = useState<Map<string, { name: string }>>(new Map());
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [weeklyOrders, setWeeklyOrders] = useState(0);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!vendor?.id) return;

    const channel = supabase
      .channel(`vendor-orders-${vendor.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "orders",
        filter: `vendor_id=eq.${vendor.id}`,
      }, (payload: { new: Record<string, unknown> }) => {
        const newOrder = payload.new as unknown as Order;
        setOrders((prev) => [newOrder, ...prev]);
        setNewOrderAlert(true);
        playNewOrderSound();
        setTimeout(() => setNewOrderAlert(false), 5000);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `vendor_id=eq.${vendor.id}`,
      }, (payload: { new: Record<string, unknown> }) => {
        const updated = payload.new as unknown as Order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendor?.id]);

  async function init() {
    const v = await getVendorForUser();
    if (v) {
      setVendor({ id: v.id, shop_name: v.shop_name, status: v.status, rating: v.rating || 0, review_count: v.review_count || 0, type: v.type });
      setIsOpen(v.status === "active");
      await loadOrders(v.id);
      await loadWeeklyStats(v.id);
    }
    setLoading(false);
  }

  async function loadOrders(vendorId: string) {
    const { data } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("vendor_id", vendorId)
      .order("placed_at", { ascending: false });
    if (data) {
      setOrders(data);
      const names = await getVendorMenuItems(vendorId);
      setMenuItemNames(names);
    }
  }

  async function loadWeeklyStats(vendorId: string) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data } = await supabase
      .from("orders")
      .select("total_amount, status")
      .eq("vendor_id", vendorId)
      .gte("placed_at", weekAgo.toISOString())
      .in("status", ["delivered"]);
    if (data) {
      setWeeklyRevenue(data.reduce((s: number, o: { total_amount: number | null }) => s + (o.total_amount || 0), 0));
      setWeeklyOrders(data.length);
    }
  }

  function playNewOrderSound() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (_) {}
  }

  const toggleOpen = async () => {
    if (!vendor) return;
    const newStatus = isOpen ? "inactive" : "active";
    await supabase.from("vendors").update({ status: newStatus }).eq("id", vendor.id);
    setIsOpen(!isOpen);
  };

  const handleAcceptOrder = async (orderId: string) => {
    setProcessingOrder(orderId);
    try {
      await supabase
        .from("orders")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "accepted" } : o)));
    } catch (err) {
      console.error("Failed to accept order:", err);
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setProcessingOrder(orderId);
    try {
      await supabase
        .from("orders")
        .update({ status: "ready_for_pickup", ready_at: new Date().toISOString() })
        .eq("id", orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "ready_for_pickup" } : o)));
    } catch (err) {
      console.error("Failed to mark ready:", err);
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!await confirm({ title: "Cancel Order", message: "Are you sure you want to cancel this order?", variant: "danger" })) return;
    setProcessingOrder(orderId);
    try {
      await supabase
        .from("orders")
        .update({ status: "cancelled", cancellation_reason: "Cancelled by vendor" })
        .eq("id", orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)));
    } catch (err) {
      console.error("Failed to cancel order:", err);
    } finally {
      setProcessingOrder(null);
    }
  };

  const { todayOrders, todayRevenue, todayItemsSold, pendingOrders, activeOrders, recentOrders } = useMemo(() => {
    const today = orders.filter((o) => {
      const d = new Date(o.placed_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    });
    const delivered = today.filter((o) => o.status === "delivered");
    return {
      todayOrders: today,
      todayRevenue: delivered.reduce((sum, o) => sum + o.total_amount, 0),
      todayItemsSold: delivered.reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0),
      pendingOrders: orders.filter((o) => o.status === "pending"),
      activeOrders: orders.filter((o) => ["accepted", "preparing"].includes(o.status)),
      recentOrders: orders.slice(0, 5),
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-[var(--color-outline-variant)] font-medium animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60 mb-4">storefront</span>
        <h2 className="text-2xl font-extrabold text-[var(--color-on-surface)] mb-2">No Vendor Found</h2>
        <p className="text-[var(--color-outline)] mb-6">You don&apos;t have a vendor account yet. Register to start selling.</p>
        <Link
          href="/partner/register"
          className="bg-[var(--color-primary)] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#a40017] transition-colors"
        >
          Register Your Store
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <audio ref={audioRef} preload="auto" />

      {/* New Order Alert Banner */}
      {newOrderAlert && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-[var(--color-primary)] to-[#ff4444] text-white p-4 rounded-2xl shadow-2xl animate-bounce">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined animate-bounce">notification_important</span>
              <div>
                <p className="font-bold text-lg">New Order Received!</p>
                <p className="text-sm opacity-90">Tap to view details</p>
              </div>
            </div>
            <button onClick={() => setNewOrderAlert(false)} className="p-2">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight">Vendor Dashboard</h1>
          <p className="text-[var(--color-outline)] mt-1">{vendor.shop_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleOpen}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isOpen
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-[var(--color-surface-container)] text-[var(--color-outline)] hover:bg-[var(--color-surface-container-high)]"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}></span>
            {isOpen ? "Open for Orders" : "Closed"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-sm border border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">receipt_long</span>
            <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">
              {todayOrders.length > 0 ? "+" + todayOrders.length : "0"} today
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{todayOrders.length}</p>
          <p className="text-sm text-[var(--color-outline)] font-medium mt-1">Today&apos;s Orders</p>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-sm border border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">paid</span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">₹{todayRevenue.toFixed(0)}</p>
          <p className="text-sm text-[var(--color-outline)] font-medium mt-1">Today&apos;s Revenue</p>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-sm border border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-amber-500">star</span>
            <span className="text-xs text-[var(--color-outline-variant)] font-medium">{vendor.review_count} reviews</span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{vendor.rating.toFixed(1)}</p>
          <p className="text-sm text-[var(--color-outline)] font-medium mt-1">Average Rating</p>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-sm border border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">inventory_2</span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{todayItemsSold}</p>
          <p className="text-sm text-[var(--color-outline)] font-medium mt-1">Items Sold Today</p>
        </div>

        <div className="bg-gradient-to-br from-[var(--color-primary)] to-[#ff4444] p-6 rounded-2xl shadow-sm text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-white/80">trending_up</span>
            <span className="text-xs text-white/70 font-medium">7 days</span>
          </div>
          <p className="text-3xl font-black">₹{weeklyRevenue.toFixed(0)}</p>
          <p className="text-sm text-white/80 font-medium mt-1">Weekly Revenue ({weeklyOrders} orders)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Orders with Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--color-on-surface)] flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              Pending Orders
              {pendingOrders.length > 0 && (
                <span className="bg-[var(--color-primary)] text-white text-xs px-2 py-0.5 rounded-full">{pendingOrders.length}</span>
              )}
            </h2>
            <Link href="/partner/orders" className="text-sm font-bold text-[var(--color-primary)] hover:underline">
              View All
            </Link>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="bg-[var(--color-surface-container-lowest)] border-2 border-dashed border-[var(--color-border-subtle)] rounded-3xl p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60 mb-3">check_circle</span>
              <p className="text-[var(--color-outline-variant)] font-medium">No pending orders</p>
              <p className="text-[var(--color-outline-variant)]/60 text-sm mt-1">New orders will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-sm border border-[var(--color-border-subtle)] border-l-4 border-l-[var(--color-primary)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[var(--color-on-surface)]">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 uppercase animate-pulse">
                        NEW
                      </span>
                    </div>
                    <span className="text-sm text-[var(--color-outline-variant)] font-medium">
                      {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {order.items?.slice(0, 3).map((item, i) => (
                      <p key={i} className="text-sm text-[var(--color-on-surface-variant)]">
                        <span className="font-bold text-[var(--color-outline-variant)] mr-1">{item.quantity}x</span>
                        {menuItemNames.get(item.menu_item_id)?.name || "Item"}
                      </p>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <p className="text-xs text-[var(--color-outline-variant)]">+{order.items!.length - 3} more items</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
                    <p className="font-extrabold text-lg text-[var(--color-primary)]">₹{order.total_amount.toFixed(2)}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={processingOrder === order.id}
                        className="px-3 py-1.5 text-xs font-bold bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] rounded-lg hover:bg-[var(--color-surface-container-high)] disabled:opacity-50 transition-all"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={processingOrder === order.id}
                        className="px-4 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all"
                      >
                        {processingOrder === order.id ? "..." : "Accept"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-bold text-[var(--color-on-surface)] flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Preparing ({activeOrders.length})
              </h2>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div key={order.id} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-sm border border-[var(--color-border-subtle)] border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[var(--color-on-surface)]">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700 uppercase">
                          {order.status}
                        </span>
                      </div>
                      <span className="text-sm text-[var(--color-outline-variant)] font-medium">
                        {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items?.slice(0, 2).map((item, i) => (
                        <p key={i} className="text-sm text-[var(--color-on-surface-variant)]">
                          <span className="font-bold text-[var(--color-outline-variant)] mr-1">{item.quantity}x</span>
                          {menuItemNames.get(item.menu_item_id)?.name || "Item"}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
                      <p className="font-extrabold text-lg text-blue-600">₹{order.total_amount.toFixed(2)}</p>
                      <button
                        onClick={() => handleMarkReady(order.id)}
                        disabled={processingOrder === order.id}
                        className="px-4 py-2 text-xs font-bold bg-brand-secondary text-white rounded-lg hover:bg-secondary-dim disabled:opacity-50 transition-all"
                      >
                        {processingOrder === order.id ? "..." : "Mark Ready for Pickup"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions & Recent Orders */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-sm border border-[var(--color-border-subtle)]">
            <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/partner/menu"
                className="bg-[var(--color-surface-subtle)] p-4 rounded-xl text-center hover:bg-[var(--color-surface-container)] transition-colors group"
              >
                <span className="material-symbols-outlined text-2xl text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)]">restaurant_menu</span>
                <p className="text-xs font-bold text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] mt-1">Manage Menu</p>
              </Link>
              <Link
                href="/partner/analytics"
                className="bg-[var(--color-surface-subtle)] p-4 rounded-xl text-center hover:bg-[var(--color-surface-container)] transition-colors group"
              >
                <span className="material-symbols-outlined text-2xl text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)]">analytics</span>
                <p className="text-xs font-bold text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] mt-1">View Analytics</p>
              </Link>
              <Link
                href="/partner/wallet"
                className="bg-[var(--color-surface-subtle)] p-4 rounded-xl text-center hover:bg-[var(--color-surface-container)] transition-colors group"
              >
                <span className="material-symbols-outlined text-2xl text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)]">account_balance_wallet</span>
                <p className="text-xs font-bold text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] mt-1">Wallet</p>
              </Link>
              <Link
                href="/partner/profile"
                className="bg-[var(--color-surface-subtle)] p-4 rounded-xl text-center hover:bg-[var(--color-surface-container)] transition-colors group"
              >
                <span className="material-symbols-outlined text-2xl text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)]">store</span>
                <p className="text-xs font-bold text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] mt-1">Store Settings</p>
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-sm border border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--color-on-surface)]">Recent Orders</h3>
              <Link href="/partner/orders" className="text-xs font-bold text-[var(--color-primary)]">See All</Link>
            </div>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-[var(--color-outline-variant)] text-center py-4">No orders yet</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-on-surface)]">#{order.id.slice(0, 6).toUpperCase()}</p>
                      <p className="text-xs text-[var(--color-outline-variant)]">{new Date(order.placed_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--color-on-surface)]">₹{order.total_amount.toFixed(0)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === "delivered" ? "bg-green-100 text-green-700" :
                        order.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
