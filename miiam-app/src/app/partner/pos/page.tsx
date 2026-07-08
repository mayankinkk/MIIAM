"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { getVendorIdForUser, getVendorMenuItems } from "@/lib/vendor";
import logger from "@/lib/logger";
import type { Order, OrderStatus } from "@/lib/types";

export default function PartnerPOS() {
  const supabase = useMemo(() => createClient(), []);
  const { confirm } = useConfirm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuItemNames, setMenuItemNames] = useState<Map<string, { name: string }>>(new Map());
  const [delayModal, setDelayModal] = useState<{ orderId: string } | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(10);
  const [delayReason, setDelayReason] = useState("");
  const [prepTimeModal, setPrepTimeModal] = useState<{ orderId: string } | null>(null);
  const [prepTime, setPrepTime] = useState(15);
  const [custHistoryModal, setCustHistoryModal] = useState<{ userId: string; orders: Order[] } | null>(null);
  const [callMaskModal, setCallMaskModal] = useState<{ orderId: string; maskedNumber: string } | null>(null);
  const [scheduledOrders, setScheduledOrders] = useState<Order[]>([]);
  const [showScheduled, setShowScheduled] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mountedRef = useRef(true);
  const prevPendingCountRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Keep pending count ref in sync with orders state
  useEffect(() => {
    prevPendingCountRef.current = orders.filter(o => o.status === "pending").length;
  }, [orders]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (delayModal) setDelayModal(null);
        else if (prepTimeModal) setPrepTimeModal(null);
        else if (custHistoryModal) setCustHistoryModal(null);
        else if (callMaskModal) setCallMaskModal(null);
      }
    };
    if (delayModal || prepTimeModal || custHistoryModal || callMaskModal) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [delayModal, prepTimeModal, custHistoryModal, callMaskModal]);

  useEffect(() => {
    mountedRef.current = true;

    async function init() {
      try {
        const id = await getVendorIdForUser();
        if (!mountedRef.current || !id) return;
        setVendorId(id);
        await loadOrders(id);
        await loadScheduledOrders(id);
        if (mountedRef.current) {
          if (channelRef.current) supabase.removeChannel(channelRef.current);
          channelRef.current = subscribeToOrders(id);
        }
      } catch (err: unknown) {
        if (mountedRef.current) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    init();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  async function loadOrders(vId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("vendor_id", vId)
      .order("placed_at", { ascending: false });
    if (error) throw error;
    if (data) {
      setOrders(data);
      const names = await getVendorMenuItems(vId);
      setMenuItemNames(names);
    }
  }

  async function loadScheduledOrders(vId: string) {
    const { data } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("vendor_id", vId)
      .eq("status", "scheduled")
      .order("scheduled_delivery", { ascending: true });
    if (data) setScheduledOrders(data);
  }

  function subscribeToOrders(vId: string) {
    const channel = supabase
      .channel("pos_orders_" + vId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${vId}` },
        async (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          const prevCount = prevPendingCountRef.current;
          await loadOrders(vId);
          if (prevPendingCountRef.current > prevCount && payload.eventType === "INSERT") {
            try {
              if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
              const ctx = audioCtxRef.current;
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(523.25, ctx.currentTime);
              osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.4);
            } catch { /* audio not supported */ }
          }
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") logger.debug("POS channel subscribed");
        else if (status === "CHANNEL_ERROR") logger.error("POS channel error");
      });
    return channel;
  }

  const updateStatus = async (orderId: string, newStatus: OrderStatus, extra?: Record<string, string | number | boolean>) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, ...extra })
      .eq("id", orderId);

    if (error) {
      useToastStore.getState().addToast("Error: " + error.message, "error");
      return;
    }

    if (["accepted", "preparing", "ready_for_pickup"].includes(newStatus)) {
      try {
        await fetch("/api/emails/order-status", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": "1" },
          body: JSON.stringify({ orderId, status: newStatus }),
        });
      } catch { /* ignore */ }
    }
  };

  const notifyDelay = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ delay_minutes: delayMinutes, delay_reason: delayReason })
      .eq("id", orderId);
    if (error) {
      useToastStore.getState().addToast("Error: " + error.message, "error");
      return;
    }
    setDelayModal(null);
    setDelayMinutes(10);
    setDelayReason("");
  };

  const statusActions: Record<string, { label: string; next: OrderStatus; color: string }[] | null> = {
    pending: [{ label: "Accept Order", next: "accepted", color: "bg-green-600 hover:bg-green-700" }],
    accepted: [{ label: "Start Preparing", next: "preparing", color: "bg-amber-600 hover:bg-amber-700" }],
    preparing: [{ label: "Mark Ready for Pickup", next: "ready_for_pickup", color: "bg-indigo-600 hover:bg-indigo-700" }],
    ready_for_pickup: null,
    on_the_way: null,
  };

  const statusBadge: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    preparing: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    ready_for_pickup: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    on_the_way: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  const terminalStatuses = ["delivered", "cancelled", "refunded"];

  if (loading) {
    return <div className="p-8 text-center text-[var(--color-outline-variant)] font-medium animate-pulse">Loading POS...</div>;
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-red-300 mb-4">error</span>
        <h2 className="text-2xl font-extrabold text-[var(--color-on-surface)] mb-2">Something went wrong</h2>
        <p className="text-[var(--color-outline)]">{error}</p>
      </div>
    );
  }

  if (!vendorId) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60 mb-4">storefront</span>
        <h2 className="text-2xl font-extrabold text-[var(--color-on-surface)] mb-2">No Vendor Account</h2>
        <p className="text-[var(--color-outline)]">Register your store to start receiving orders.</p>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => !terminalStatuses.includes(o.status));
  const pastOrders = orders.filter((o) => terminalStatuses.includes(o.status));

  return (
    <>
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-2">Live Order POS</h1>
        <p className="text-[var(--color-outline)]">Manage real-time incoming orders — your job ends when order is ready for pickup</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-sm border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline)] text-sm font-bold uppercase tracking-wider mb-1">Active</p>
          <p className="text-4xl font-black text-[var(--color-primary)]">{activeOrders.length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-sm border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline)] text-sm font-bold uppercase tracking-wider mb-1">Pending</p>
          <p className="text-4xl font-black text-amber-600">{orders.filter((o) => o.status === "pending").length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-sm border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline)] text-sm font-bold uppercase tracking-wider mb-1">Ready for Pickup</p>
          <p className="text-4xl font-black text-purple-600">{orders.filter((o) => o.status === "ready_for_pickup").length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-sm border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline)] text-sm font-bold uppercase tracking-wider mb-1">Delivered</p>
          <p className="text-4xl font-black text-green-600">{orders.filter((o) => o.status === "delivered").length}</p>
        </div>
        <button onClick={() => setShowScheduled(!showScheduled)} className={`p-6 rounded-2xl shadow-sm border text-left transition-colors ${showScheduled ? "bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-700" : "bg-[var(--color-surface-container-lowest)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]"}`}>
          <p className="text-[var(--color-outline)] text-sm font-bold uppercase tracking-wider mb-1">Scheduled</p>
          <p className="text-4xl font-black text-indigo-600">{scheduledOrders.length}</p>
        </button>
      </div>

      {/* Scheduled Orders */}
      {showScheduled && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--color-on-surface)] flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">calendar_month</span>
              Scheduled Orders
            </h2>
            <span className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest">Upcoming</span>
          </div>
          {scheduledOrders.length === 0 ? (
            <div className="bg-[var(--color-surface-container-lowest)] border-2 border-dashed border-[var(--color-border-subtle)] rounded-3xl p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60 mb-3">calendar_month</span>
              <p className="text-[var(--color-outline-variant)] font-medium">No scheduled orders</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {scheduledOrders.map((order) => (
                <div key={order.id} className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-5 shadow-sm border border-indigo-100 border-l-4 border-l-indigo-500">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-lg font-black text-[var(--color-on-surface)]">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined text-sm text-indigo-500">schedule</span>
                        <span className="text-sm font-bold text-indigo-600">
                          {order.scheduled_delivery ? new Date(order.scheduled_delivery).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) : "N/A"}
                        </span>
                        <span className="text-sm text-indigo-400">
                          {order.scheduled_delivery ? new Date(order.scheduled_delivery).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </div>
                    <p className="text-xl font-black text-indigo-600">₹{order.total_amount.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.items?.map((item, idx) => (
                      <span key={idx} className="text-xs bg-[var(--color-surface-container)] px-2 py-1 rounded-lg font-medium text-[var(--color-on-surface-variant)]">
                        {item.quantity}x {menuItemNames.get(item.menu_item_id)?.name || "Item"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Active Orders Feed */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[var(--color-on-surface)] flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              Active Orders
            </h2>
            <button
              onClick={() => { setBatchMode(!batchMode); setBatchSelected(new Set()); }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                batchMode ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-[var(--color-surface-container-lowest)] text-[var(--color-outline)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]"
              }`}
            >
              Batch
            </button>
          </div>
          <div className="flex items-center gap-2">
            {batchMode && batchSelected.size > 0 && (
              <>
                <span className="text-xs text-[var(--color-outline)]">{batchSelected.size} selected</span>
                {activeOrders.some(o => o.status === "pending" && batchSelected.has(o.id)) && (
                  <button
                    onClick={async () => {
                      const ids = activeOrders.filter(o => o.status === "pending" && batchSelected.has(o.id)).map(o => o.id);
                      for (const oid of ids) await updateStatus(oid, "accepted");
                      setBatchSelected(new Set());
                      setBatchMode(false);
                    }}
                    className="text-xs font-bold px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Accept All
                  </button>
                )}
                {activeOrders.some(o => o.status === "pending" && batchSelected.has(o.id)) && (
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Decline All Orders",
                        message: "Are you sure you want to decline all selected pending orders?",
                        confirmText: "Decline All",
                        variant: "danger",
                      });
                      if (!ok) return;
                      const ids = activeOrders.filter(o => o.status === "pending" && batchSelected.has(o.id)).map(o => o.id);
                      for (const oid of ids) await updateStatus(oid, "cancelled");
                      setBatchSelected(new Set());
                      setBatchMode(false);
                    }}
                    className="text-xs font-bold px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Decline All
                  </button>
                )}
                {activeOrders.some(o => o.status === "accepted" && batchSelected.has(o.id)) && (
                  <button
                    onClick={async () => {
                      const ids = activeOrders.filter(o => o.status === "accepted" && batchSelected.has(o.id)).map(o => o.id);
                      for (const oid of ids) await updateStatus(oid, "preparing", { estimated_prep_time: 15 });
                      setBatchSelected(new Set());
                      setBatchMode(false);
                    }}
                    className="text-xs font-bold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Start All
                  </button>
                )}
              </>
            )}
            <span className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest">Real-time</span>
          </div>
        </div>

        {activeOrders.length === 0 ? (
          <div className="bg-[var(--color-surface-container-lowest)] border-2 border-dashed border-[var(--color-border-subtle)] rounded-3xl p-8 md:p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60 mb-4">check_circle</span>
            <p className="text-[var(--color-outline-variant)] font-medium text-lg">All caught up!</p>
            <p className="text-[var(--color-outline-variant)]/60 text-sm mt-1">Waiting for new orders...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {activeOrders.map((order) => {
              const actions = statusActions[order.status];
              return (
                <div
                  key={order.id}
                  className={`bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 shadow-sm border transition-all ${
                    batchSelected.has(order.id) ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20" : "border-[var(--color-border-subtle)] hover:shadow-md"
                  }`}
                >
                  {batchMode && (
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={batchSelected.has(order.id)}
                        onChange={() => {
                          const next = new Set(batchSelected);
                          if (next.has(order.id)) next.delete(order.id); else next.add(order.id);
                          setBatchSelected(next);
                        }}
                        className="w-4 h-4 accent-[var(--color-primary)]"
                      />
                      <span className="text-xs text-[var(--color-outline)]">Select</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-black text-[var(--color-on-surface)]">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusBadge[order.status] || "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-[var(--color-outline-variant)] text-xs font-medium">
                        {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" • "}
                        {order.payment_method === "wallet" ? "Wallet" : "Online"}
                      </p>
                      {order.user_id && (
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={async () => {
                              const { data: pastOrders } = await supabase
                                .from("orders")
                                .select("id, status, total_amount, placed_at, items:order_items(menu_item_id, quantity, unit_price)")
                                .eq("user_id", order.user_id)
                                .eq("vendor_id", vendorId)
                                .neq("id", order.id)
                                .order("placed_at", { ascending: false })
                                .limit(10);
                              setCustHistoryModal({ userId: order.user_id, orders: pastOrders || [] });
                            }}
                            className="text-[10px] text-[var(--color-primary)] font-bold hover:underline"
                          >
                            View customer history
                          </button>
                          <span className="text-[var(--color-outline-variant)]/60">|</span>
                          <button
                            onClick={() => {
                              const masked = `+1-800-MIIAM-${order.id.slice(-4).toUpperCase()}`;
                              navigator.clipboard.writeText(masked);
                              setCallMaskModal({ orderId: order.id, maskedNumber: masked });
                            }}
                            className="text-[10px] text-green-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[12px]">call</span>
                            Call Customer
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-[var(--color-primary)]">₹{order.total_amount.toFixed(2)}</p>
                      {order.delivery_address && (
                        <p className="text-[10px] text-[var(--color-outline-variant)] mt-1 max-w-[160px] truncate">{order.delivery_address}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 bg-[var(--color-surface-subtle)] p-4 rounded-2xl border border-[var(--color-border-subtle)]">
                    {order.items?.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between items-center text-sm">
                          <p className="text-[var(--color-on-surface)] font-bold">
                            <span className="text-[var(--color-outline-variant)] mr-2">{item.quantity}x</span>
                            {menuItemNames.get(item.menu_item_id)?.name || "Unknown Item"}
                          </p>
                          <p className="text-[var(--color-outline)] font-medium">
                            ₹{(item.unit_price * item.quantity).toFixed(0)}
                          </p>
                        </div>
                        {item.special_notes && (
                          <p className="text-xs text-amber-600 ml-6 mt-0.5">📝 {item.special_notes}</p>
                        )}
                      </div>
                    ))}
                    {order.special_instructions && (
                      <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                        <p className="text-xs text-[var(--color-outline)]">
                          <span className="font-bold">Note: </span>{order.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {actions ? (
                      actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (action.label === "Start Preparing") {
                              setPrepTimeModal({ orderId: order.id });
                            } else {
                              updateStatus(order.id, action.next);
                            }
                          }}
                          className={`flex-1 ${action.color} text-white py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none`}
                        >
                          {action.label}
                        </button>
                      ))
                    ) : order.status === "ready_for_pickup" ? (
                      <div className="flex-1 text-center py-4 rounded-xl bg-purple-50 text-purple-700 font-bold text-sm border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                        <span className="material-symbols-outlined align-middle text-lg mr-1">pedal_bike</span>
                        Waiting for Rider to Pick Up
                      </div>
                    ) : order.status === "on_the_way" ? (
                      <div className="flex-1 text-center py-4 rounded-xl bg-cyan-50 text-cyan-700 font-bold text-sm border border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800">
                        Out for Delivery — Rider on the Way
                      </div>
                    ) : null}
                    {order.delay_minutes && order.delay_minutes > 0 ? (
                      <div className="w-full mt-2 py-2 px-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        Delayed — {order.delay_reason || "Running late"} (+{order.delay_minutes} min)
                      </div>
                    ) : ["accepted", "preparing"].includes(order.status) ? (
                      <button
                        onClick={() => setDelayModal({ orderId: order.id })}
                        className="w-full mt-2 py-2 rounded-xl border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors text-xs font-bold"
                      >
                        <span className="material-symbols-outlined align-middle text-sm mr-1">schedule</span>
                        Notify Delay
                      </button>
                    ) : null}
                    {order.status === "pending" && (
                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Decline Order",
                            message: "Are you sure you want to decline this order?",
                            confirmText: "Decline",
                            variant: "danger",
                          });
                          if (ok) updateStatus(order.id, "cancelled");
                        }}
                        className="px-6 border border-red-200 text-red-400 hover:text-red-600 hover:border-red-300 transition-colors rounded-xl font-bold text-xs"
                      >
                        Decline
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Past Orders */}
      <section className="pt-4">
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-6">Completed / Cancelled</h2>
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl overflow-hidden shadow-sm border border-[var(--color-border-subtle)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Past completed and cancelled orders</caption>
              <thead className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-border-subtle)]">
                <tr>
                  <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Order</th>
                  <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Items</th>
                  <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest text-right">Amount</th>
                  <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {pastOrders.slice(0, 15).map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--color-surface-subtle)] transition-colors">
                    <td className="p-4 text-xs font-bold text-[var(--color-on-surface)]">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4 text-xs text-[var(--color-outline)] font-medium">
                      {order.items?.length || 0} items
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                        order.status === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                        order.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                        "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-black text-[var(--color-on-surface)] text-right">
                      ₹{order.total_amount.toFixed(0)}
                    </td>
                    <td className="p-4 text-xs text-[var(--color-outline-variant)] text-right">
                      {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      </div>

      {/* Delay Notification Modal */}
      {delayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDelayModal(null)} role="dialog" aria-modal="true" aria-labelledby="delay-modal-title">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-3xl text-orange-500">schedule</span>
              <div>
                <h3 id="delay-modal-title" className="text-lg font-extrabold text-[var(--color-on-surface)]">Notify Delay</h3>
                <p className="text-xs text-[var(--color-outline)]">Inform customer about the delay</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-1">Delay (minutes)</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 30].map((m) => (
                    <button
                      key={m}
                      onClick={() => setDelayMinutes(m)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                        delayMinutes === m
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-1">Reason (optional)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {["High order volume", "Staff shortage", "Ingredient unavailable", "Equipment issue"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setDelayReason(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        delayReason === r
                          ? "bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800"
                          : "bg-[var(--color-surface-container)] text-[var(--color-outline)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-container-high)]"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or type a custom reason..."
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDelayModal(null)}
                  className="flex-1 py-3 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-on-surface-variant)] font-bold text-sm hover:bg-[var(--color-surface-subtle)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => notifyDelay(delayModal.orderId)}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all shadow-md"
                >
                  Notify Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prep Time Modal */}
      {prepTimeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPrepTimeModal(null)} role="dialog" aria-modal="true" aria-labelledby="prep-time-modal-title">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-3xl text-amber-500">timer</span>
              <div>
                <h3 id="prep-time-modal-title" className="text-lg font-extrabold text-[var(--color-on-surface)]">Set Preparation Time</h3>
                <p className="text-xs text-[var(--color-outline)]">How long will this order take to prepare?</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider block mb-3">Estimated time</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPrepTime(m)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                        prepTime === m
                          ? "bg-amber-500 text-white shadow-md"
                          : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                      }`}
                    >
                      {m < 60 ? `${m}m` : `${Math.floor(m/60)}h`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2 dark:bg-amber-900/20 dark:text-amber-300">
                <span className="material-symbols-outlined text-sm">info</span>
                <p>The customer will see &ldquo;Estimated ready by {new Date(Date.now() + prepTime * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}&rdquo;</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setPrepTimeModal(null)}
                  className="flex-1 py-3 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-on-surface-variant)] font-bold text-sm hover:bg-[var(--color-surface-subtle)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateStatus(prepTimeModal.orderId, "preparing", { estimated_prep_time: prepTime });
                    setPrepTimeModal(null);
                    setPrepTime(15);
                  }}
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all shadow-md"
                >
                  Start Preparing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer History Modal */}
      {custHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCustHistoryModal(null)} role="dialog" aria-modal="true" aria-labelledby="cust-history-modal-title">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 id="cust-history-modal-title" className="text-lg font-extrabold text-[var(--color-on-surface)]">Customer Order History</h3>
              <button onClick={() => setCustHistoryModal(null)} className="w-10 h-10 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center" aria-label="Close">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            {custHistoryModal.orders.length === 0 ? (
              <p className="text-[var(--color-outline-variant)] text-sm text-center py-8">No previous orders from this customer</p>
            ) : (
              <div className="space-y-3">
                {custHistoryModal.orders.map((o) => (
                  <div key={o.id} className="bg-[var(--color-surface-subtle)] rounded-xl p-4 border border-[var(--color-border-subtle)]">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[var(--color-on-surface)]">#{o.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        o.status === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : o.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                      }`}>{o.status}</span>
                    </div>
                    <div className="text-xs text-[var(--color-outline)]">
                      {new Date(o.placed_at).toLocaleDateString()} • ₹{o.total_amount.toFixed(2)} • {o.items?.length || 0} items
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Call Masking Modal */}
      {callMaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCallMaskModal(null)} role="dialog" aria-modal="true" aria-labelledby="call-mask-modal-title">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-sm rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 id="call-mask-modal-title" className="font-extrabold text-[var(--color-on-surface)]">Connect Call</h3>
              <button onClick={() => setCallMaskModal(null)} className="w-10 h-10 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center" aria-label="Close">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto dark:bg-green-900/30">
                <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
              </div>
              <div>
                <p className="text-sm text-[var(--color-outline)]">Masked Number</p>
                <p className="text-xl font-black text-[var(--color-on-surface)] tracking-wider">{callMaskModal.maskedNumber}</p>
              </div>
              <p className="text-xs text-[var(--color-outline-variant)]">This masked number connects you to the customer without revealing either party&apos;s real number. Number copied to clipboard.</p>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <p className="text-xs text-amber-700 flex items-center gap-1 dark:text-amber-300">
                  <span className="material-symbols-outlined text-sm">info</span>
                  For production, configure Twilio proxy in your dashboard settings
                </p>
              </div>
              <button
                onClick={() => setCallMaskModal(null)}
                className="block w-full py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dim)] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
