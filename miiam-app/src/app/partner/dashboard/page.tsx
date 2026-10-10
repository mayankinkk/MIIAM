"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { getVendorForUser, getVendorMenuItems } from "@/lib/vendor";
import { restoreStock } from "@/lib/stock";
import { VendorDashboardSkeleton } from "@/components/vendor/VendorSkeleton";
import type { Order } from "@/lib/types";
import logger from "@/lib/logger";

export default function VendorDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const { confirm } = useConfirm();
  const [vendor, setVendor] = useState<{
    id: string;
    shop_name: string;
    status: string;
    rating: number;
    review_count: number;
    type?: string;
  } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [menuItemNames, setMenuItemNames] = useState<Map<string, { name: string }>>(new Map());
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [weeklyOrders, setWeeklyOrders] = useState(0);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [autoAccept, setAutoAccept] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const processedOrdersRef = useRef(new Set<string>());
  const rejectReasons = ["Out of stock", "Too busy", "Store closing", "Item unavailable", "Other"];

  useEffect(() => {
    init().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!vendor?.id) return;

    const channel = supabase
      .channel(`vendor-orders-${vendor.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `vendor_id=eq.${vendor.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newOrder = payload.new as unknown as Order;
          setOrders((prev) => [newOrder, ...prev]);
          setNewOrderAlert(true);
          playNewOrderSound();
          setTimeout(() => setNewOrderAlert(false), 5000);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `vendor_id=eq.${vendor.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const updated = payload.new as unknown as Order;
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendor?.id]);

  async function init() {
    const v = await getVendorForUser();
    if (v) {
      setVendor({
        id: v.id,
        shop_name: v.shop_name,
        status: v.status,
        rating: v.rating || 0,
        review_count: v.review_count || 0,
        type: v.type,
      });
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
      setWeeklyRevenue(
        data.reduce((s: number, o: { total_amount: number | null }) => s + (o.total_amount || 0), 0)
      );
      setWeeklyOrders(data.length);
    }
  }

  function playNewOrderSound() {
    try {
      const ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
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
      logger.error({ err }, "Failed to accept order");
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
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "ready_for_pickup" } : o))
      );
    } catch (err) {
      logger.error({ err }, "Failed to mark ready");
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleCancelOrder = async (orderId: string, reason?: string) => {
    if (
      !(await confirm({
        title: "Cancel Order",
        message: "Are you sure you want to cancel this order?",
        variant: "danger",
      }))
    )
      return;
    setProcessingOrder(orderId);
    try {
      await supabase
        .from("orders")
        .update({
          status: "cancelled",
          cancellation_reason: reason || "Cancelled by vendor",
          cancelled_by: "vendor",
        })
        .eq("id", orderId);
      await restoreStock(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)));
    } catch (err) {
      logger.error({ err }, "Failed to cancel order");
    } finally {
      setProcessingOrder(null);
    }
  };

  const { todayOrders, todayRevenue, todayItemsSold, pendingOrders, activeOrders, recentOrders } =
    useMemo(() => {
      const today = orders.filter((o) => {
        const d = new Date(o.placed_at);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      });
      const delivered = today.filter((o) => o.status === "delivered");
      return {
        todayOrders: today,
        todayRevenue: delivered.reduce((sum, o) => sum + o.total_amount, 0),
        todayItemsSold: delivered.reduce(
          (sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0),
          0
        ),
        pendingOrders: orders.filter((o) => o.status === "pending"),
        activeOrders: orders.filter((o) =>
          ["accepted", "preparing", "ready_for_pickup"].includes(o.status)
        ),
        recentOrders: orders.slice(0, 5),
      };
    }, [orders]);

  useEffect(() => {
    if (!autoAccept || !vendor?.id) return;
    pendingOrders.forEach((order) => {
      if (!processedOrdersRef.current.has(order.id)) {
        processedOrdersRef.current.add(order.id);
        handleAcceptOrder(order.id);
      }
    });
  }, [autoAccept, pendingOrders, vendor?.id]);

  const openRejectModal = (orderId: string) => {
    setShowRejectModal(orderId);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!showRejectModal || !rejectReason) return;
    await handleCancelOrder(showRejectModal, rejectReason);
    setShowRejectModal(null);
    setRejectReason("");
  };

  if (loading) {
    return <VendorDashboardSkeleton />;
  }

  if (!vendor) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined mb-4 text-6xl text-[var(--color-outline-variant)]/60">
          storefront
        </span>
        <h2 className="mb-2 text-2xl font-extrabold text-[var(--color-on-surface)]">
          No Vendor Found
        </h2>
        <p className="mb-6 text-[var(--color-outline)]">
          You don&apos;t have a vendor account yet. Register to start selling.
        </p>
        <Link
          href="/partner/register"
          className="text-on-primary rounded-2xl bg-[var(--color-primary)] px-8 py-4 font-bold transition-colors hover:bg-[var(--color-primary-dim)]"
        >
          Register Your Store
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* New Order Alert Banner */}
      {newOrderAlert && (
        <div
          className="fixed top-4 right-4 left-4 z-50 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-error)] p-4 text-white shadow-2xl transition-all"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined animate-bounce">
                notification_important
              </span>
              <div>
                <p className="text-lg font-bold">New Order Received!</p>
                <p className="text-sm opacity-90">Tap to view details</p>
              </div>
            </div>
            <button onClick={() => setNewOrderAlert(false)} className="p-2" aria-label="Close">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Vendor Dashboard
          </h1>
          <p className="mt-1 text-[var(--color-outline)]">{vendor.shop_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleOpen}
            role="switch"
            aria-checked={isOpen}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              isOpen
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                : "bg-[var(--color-surface-container)] text-[var(--color-outline)] hover:bg-[var(--color-surface-container-high)]"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isOpen ? "animate-pulse bg-green-500" : "bg-slate-400 dark:bg-slate-600"}`}
            ></span>
            {isOpen ? "Open for Orders" : "Closed"}
          </button>
          <button
            onClick={() => setAutoAccept(!autoAccept)}
            role="switch"
            aria-checked={autoAccept}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              autoAccept
                ? "bg-deal/10 text-deal hover:bg-accent/20 dark:bg-accent/20 dark:text-accent"
                : "bg-[var(--color-surface-container)] text-[var(--color-outline)] hover:bg-[var(--color-surface-container-high)]"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${autoAccept ? "bg-accent animate-pulse" : "bg-slate-400 dark:bg-slate-600"}`}
            ></span>
            {autoAccept ? "Auto-Accept On" : "Auto-Accept Off"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span
              className="material-symbols-outlined text-[var(--color-outline-variant)]"
              aria-hidden="true"
            >
              receipt_long
            </span>
            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600 dark:bg-green-900/20 dark:text-green-400">
              {todayOrders.length > 0 ? "+" + todayOrders.length : "0"} today
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{todayOrders.length}</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-outline)]">
            Today&apos;s Orders
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span
              className="material-symbols-outlined text-[var(--color-outline-variant)]"
              aria-hidden="true"
            >
              paid
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">
            ₹{todayRevenue.toFixed(0)}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--color-outline)]">
            Today&apos;s Revenue
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="material-symbols-outlined text-amber-500" aria-hidden="true">
              star
            </span>
            <span className="text-xs font-medium text-[var(--color-outline-variant)]">
              {vendor.review_count} reviews
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">
            {vendor.rating.toFixed(1)}
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--color-outline)]">Average Rating</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span
              className="material-symbols-outlined text-[var(--color-outline-variant)]"
              aria-hidden="true"
            >
              inventory_2
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{todayItemsSold}</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-outline)]">Items Sold Today</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-error)] p-6 text-white shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="material-symbols-outlined text-white/80" aria-hidden="true">
              trending_up
            </span>
            <span className="text-xs font-medium text-white/70">7 days</span>
          </div>
          <p className="text-3xl font-black">₹{weeklyRevenue.toFixed(0)}</p>
          <p className="mt-1 text-sm font-medium text-white/80">
            Weekly Revenue ({weeklyOrders} orders)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Pending Orders with Quick Actions */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--color-on-surface)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
              Pending Orders
              {pendingOrders.length > 0 && (
                <span className="text-on-primary rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs">
                  {pendingOrders.length}
                </span>
              )}
            </h2>
            <Link
              href="/partner/orders"
              className="text-sm font-bold text-[var(--color-primary)] hover:underline"
            >
              View All
            </Link>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-12 text-center">
              <span className="material-symbols-outlined mb-3 text-5xl text-[var(--color-outline-variant)]/60">
                check_circle
              </span>
              <p className="font-medium text-[var(--color-outline-variant)]">No pending orders</p>
              <p className="mt-1 text-sm text-[var(--color-outline-variant)]/60">
                New orders will appear here in real-time
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-l-4 border-[var(--color-border-subtle)] border-l-[var(--color-primary)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[var(--color-on-surface)]">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="animate-pulse rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-300">
                        NEW
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[var(--color-outline-variant)]">
                      {new Date(order.placed_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="mb-3 space-y-1">
                    {order.items?.slice(0, 3).map((item, i) => (
                      <p key={i} className="text-sm text-[var(--color-on-surface-variant)]">
                        <span className="mr-1 font-bold text-[var(--color-outline-variant)]">
                          {item.quantity}x
                        </span>
                        {menuItemNames.get(item.menu_item_id)?.name || "Item"}
                      </p>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <p className="text-xs text-[var(--color-outline-variant)]">
                        +{order.items!.length - 3} more items
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3">
                    <p className="text-lg font-extrabold text-[var(--color-primary)]">
                      ₹{(order.total_amount || 0).toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openRejectModal(order.id)}
                        disabled={processingOrder === order.id}
                        className="rounded-lg bg-[var(--color-surface-container)] px-3 py-1.5 text-xs font-bold text-[var(--color-on-surface-variant)] transition-all hover:bg-[var(--color-surface-container-high)] disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={processingOrder === order.id}
                        className="rounded-lg bg-green-500 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-green-600 disabled:opacity-50"
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
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[var(--color-on-surface)]">
                <span className="bg-accent h-2 w-2 animate-pulse rounded-full"></span>
                Preparing ({activeOrders.length})
              </h2>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border-l-accent rounded-2xl border border-l-4 border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[var(--color-on-surface)]">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="bg-deal/10 text-deal dark:bg-accent/20 dark:text-accent rounded-full px-2 py-1 text-[10px] font-bold uppercase">
                          {order.status}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-[var(--color-outline-variant)]">
                        {new Date(order.placed_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="mb-3 space-y-1">
                      {order.items?.slice(0, 2).map((item, i) => (
                        <p key={i} className="text-sm text-[var(--color-on-surface-variant)]">
                          <span className="mr-1 font-bold text-[var(--color-outline-variant)]">
                            {item.quantity}x
                          </span>
                          {menuItemNames.get(item.menu_item_id)?.name || "Item"}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3">
                      <p className="text-accent text-lg font-extrabold">
                        ₹{(order.total_amount || 0).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleMarkReady(order.id)}
                        disabled={processingOrder === order.id}
                        className="bg-brand-secondary hover:bg-secondary-dim rounded-lg px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
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
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/partner/menu"
                className="group rounded-xl bg-[var(--color-surface-subtle)] p-4 text-center transition-colors hover:bg-[var(--color-surface-container)]"
              >
                <span className="material-symbols-outlined text-2xl text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)]">
                  restaurant_menu
                </span>
                <p className="mt-1 text-xs font-bold text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]">
                  Manage Menu
                </p>
              </Link>
              <Link
                href="/partner/analytics"
                className="group rounded-xl bg-[var(--color-surface-subtle)] p-4 text-center transition-colors hover:bg-[var(--color-surface-container)]"
              >
                <span className="material-symbols-outlined text-2xl text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)]">
                  analytics
                </span>
                <p className="mt-1 text-xs font-bold text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]">
                  View Analytics
                </p>
              </Link>
              <Link
                href="/partner/wallet"
                className="group rounded-xl bg-[var(--color-surface-subtle)] p-4 text-center transition-colors hover:bg-[var(--color-surface-container)]"
              >
                <span className="material-symbols-outlined text-2xl text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)]">
                  account_balance_wallet
                </span>
                <p className="mt-1 text-xs font-bold text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]">
                  Wallet
                </p>
              </Link>
              <Link
                href="/partner/profile"
                className="group rounded-xl bg-[var(--color-surface-subtle)] p-4 text-center transition-colors hover:bg-[var(--color-surface-container)]"
              >
                <span className="material-symbols-outlined text-2xl text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)]">
                  store
                </span>
                <p className="mt-1 text-xs font-bold text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]">
                  Store Settings
                </p>
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-on-surface)]">Recent Orders</h3>
              <Link
                href="/partner/orders"
                className="text-xs font-bold text-[var(--color-primary)]"
              >
                See All
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--color-outline-variant)]">
                  No orders yet
                </p>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0 dark:border-slate-700"
                  >
                    <div>
                      <p className="text-sm font-bold text-[var(--color-on-surface)]">
                        #{order.id.slice(0, 6).toUpperCase()}
                      </p>
                      <p className="text-xs text-[var(--color-outline-variant)]">
                        {new Date(order.placed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--color-on-surface)]">
                        ₹{(order.total_amount || 0).toFixed(0)}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}
                      >
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

      {/* Reject Order Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowRejectModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
        >
          <div
            className="m-4 w-full max-w-sm rounded-3xl bg-[var(--color-surface-container-lowest)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="reject-modal-title"
              className="mb-4 text-xl font-extrabold text-[var(--color-on-surface)]"
            >
              Decline Order
            </h2>
            <p className="mb-4 text-sm text-[var(--color-outline)]">
              Select a reason for declining this order:
            </p>
            <div className="mb-6 space-y-2" role="radiogroup" aria-label="Rejection reason">
              {rejectReasons.map((reason) => (
                <label
                  key={reason}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors ${rejectReason === reason ? "border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20" : "bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-container)]"}`}
                >
                  <input
                    type="radio"
                    name="reject-reason"
                    value={reason}
                    checked={rejectReason === reason}
                    onChange={() => setRejectReason(reason)}
                    className="accent-red-500"
                  />
                  <span className="text-sm font-medium text-[var(--color-on-surface)]">
                    {reason}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(null)}
                className="flex-1 rounded-xl bg-[var(--color-surface-container)] py-3 font-bold text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-high)]"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason}
                className="flex-1 rounded-xl bg-red-500 py-3 font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
