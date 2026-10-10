"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { getVendorIdForUser, getVendorMenuItems } from "@/lib/vendor";
import { restoreStock } from "@/lib/stock";
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
  const [custHistoryModal, setCustHistoryModal] = useState<{
    userId: string;
    orders: Order[];
  } | null>(null);
  const [callMaskModal, setCallMaskModal] = useState<{
    orderId: string;
    maskedNumber: string;
  } | null>(null);
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
    prevPendingCountRef.current = orders.filter((o) => o.status === "pending").length;
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
        async (payload: {
          eventType: string;
          new: Record<string, unknown>;
          old: Record<string, unknown>;
        }) => {
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
            } catch {
              /* audio not supported */
            }
          }
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") logger.debug("POS channel subscribed");
        else if (status === "CHANNEL_ERROR") logger.error("POS channel error");
      });
    return channel;
  }

  const updateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    extra?: Record<string, string | number | boolean>
  ) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, ...extra })
      .eq("id", orderId);

    if (error) {
      useToastStore.getState().addToast("Error: " + error.message, "error");
      return;
    }

    if (newStatus === "cancelled") {
      await restoreStock(orderId);
    }

    if (["accepted", "preparing", "ready_for_pickup"].includes(newStatus)) {
      try {
        await fetch("/api/emails/order-status", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": "1" },
          body: JSON.stringify({ orderId, status: newStatus }),
        });
      } catch {
        /* ignore */
      }
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

  const statusActions: Record<
    string,
    { label: string; next: OrderStatus; color: string }[] | null
  > = {
    pending: [
      { label: "Accept Order", next: "accepted", color: "bg-green-600 hover:bg-green-700" },
    ],
    accepted: [
      { label: "Start Preparing", next: "preparing", color: "bg-amber-600 hover:bg-amber-700" },
    ],
    preparing: [
      {
        label: "Mark Ready for Pickup",
        next: "ready_for_pickup",
        color: "bg-accent hover:bg-primary-hover",
      },
    ],
    ready_for_pickup: null,
    on_the_way: null,
  };

  const statusBadge: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    accepted: "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal",
    preparing: "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal",
    ready_for_pickup: "bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent",
    on_the_way: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  const terminalStatuses = ["delivered", "cancelled", "refunded"];

  if (loading) {
    return (
      <div className="animate-pulse p-8 text-center font-medium text-[var(--color-outline-variant)]">
        Loading POS...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined mb-4 text-6xl text-red-300">error</span>
        <h2 className="mb-2 text-2xl font-extrabold text-[var(--color-on-surface)]">
          Something went wrong
        </h2>
        <p className="text-[var(--color-outline)]">{error}</p>
      </div>
    );
  }

  if (!vendorId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined mb-4 text-6xl text-[var(--color-outline-variant)]/60">
          storefront
        </span>
        <h2 className="mb-2 text-2xl font-extrabold text-[var(--color-on-surface)]">
          No Vendor Account
        </h2>
        <p className="text-[var(--color-outline)]">
          Register your store to start receiving orders.
        </p>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => !terminalStatuses.includes(o.status));
  const pastOrders = orders.filter((o) => terminalStatuses.includes(o.status));

  return (
    <>
      <div className="space-y-8 p-4 md:p-8">
        <div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Live Order POS
          </h1>
          <p className="text-[var(--color-outline)]">
            Manage real-time incoming orders — your job ends when order is ready for pickup
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <p className="mb-1 text-sm font-bold tracking-wider text-[var(--color-outline)] uppercase">
              Active
            </p>
            <p className="text-4xl font-black text-[var(--color-primary)]">{activeOrders.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <p className="mb-1 text-sm font-bold tracking-wider text-[var(--color-outline)] uppercase">
              Pending
            </p>
            <p className="text-4xl font-black text-amber-600">
              {orders.filter((o) => o.status === "pending").length}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <p className="mb-1 text-sm font-bold tracking-wider text-[var(--color-outline)] uppercase">
              Ready for Pickup
            </p>
            <p className="text-accent text-4xl font-black">
              {orders.filter((o) => o.status === "ready_for_pickup").length}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <p className="mb-1 text-sm font-bold tracking-wider text-[var(--color-outline)] uppercase">
              Delivered
            </p>
            <p className="text-4xl font-black text-green-600">
              {orders.filter((o) => o.status === "delivered").length}
            </p>
          </div>
          <button
            onClick={() => setShowScheduled(!showScheduled)}
            className={`rounded-2xl border p-6 text-left shadow-sm transition-colors ${showScheduled ? "bg-accent/10 border-accent/40 dark:bg-accent/20 dark:border-accent/40" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-subtle)]"}`}
          >
            <p className="mb-1 text-sm font-bold tracking-wider text-[var(--color-outline)] uppercase">
              Scheduled
            </p>
            <p className="text-accent text-4xl font-black">{scheduledOrders.length}</p>
          </button>
        </div>

        {/* Scheduled Orders */}
        {showScheduled && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--color-on-surface)]">
                <span className="material-symbols-outlined text-accent">calendar_month</span>
                Scheduled Orders
              </h2>
              <span className="text-xs font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
                Upcoming
              </span>
            </div>
            {scheduledOrders.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-12 text-center">
                <span className="material-symbols-outlined mb-3 text-5xl text-[var(--color-outline-variant)]/60">
                  calendar_month
                </span>
                <p className="font-medium text-[var(--color-outline-variant)]">
                  No scheduled orders
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {scheduledOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border-accent/40 border-l-accent rounded-3xl border border-l-4 bg-[var(--color-surface-container-lowest)] p-5 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <span className="text-lg font-black text-[var(--color-on-surface)]">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-accent text-sm">
                            schedule
                          </span>
                          <span className="text-accent text-sm font-bold">
                            {order.scheduled_delivery
                              ? new Date(order.scheduled_delivery).toLocaleDateString([], {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "N/A"}
                          </span>
                          <span className="text-accent text-sm">
                            {order.scheduled_delivery
                              ? new Date(order.scheduled_delivery).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                      </div>
                      <p className="text-accent text-xl font-black">
                        ₹{order.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.items?.map((item, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-[var(--color-surface-container)] px-2 py-1 text-xs font-medium text-[var(--color-on-surface-variant)]"
                        >
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
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--color-on-surface)]">
                <span className="h-2 w-2 animate-ping rounded-full bg-red-500"></span>
                Active Orders
              </h2>
              <button
                onClick={() => {
                  setBatchMode(!batchMode);
                  setBatchSelected(new Set());
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                  batchMode
                    ? "text-on-primary border-[var(--color-primary)] bg-[var(--color-primary)]"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] text-[var(--color-outline)] hover:bg-[var(--color-surface-subtle)]"
                }`}
              >
                Batch
              </button>
            </div>
            <div className="flex items-center gap-2">
              {batchMode && batchSelected.size > 0 && (
                <>
                  <span className="text-xs text-[var(--color-outline)]">
                    {batchSelected.size} selected
                  </span>
                  {activeOrders.some((o) => o.status === "pending" && batchSelected.has(o.id)) && (
                    <button
                      onClick={async () => {
                        const ids = activeOrders
                          .filter((o) => o.status === "pending" && batchSelected.has(o.id))
                          .map((o) => o.id);
                        for (const oid of ids) await updateStatus(oid, "accepted");
                        setBatchSelected(new Set());
                        setBatchMode(false);
                      }}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                    >
                      Accept All
                    </button>
                  )}
                  {activeOrders.some((o) => o.status === "pending" && batchSelected.has(o.id)) && (
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Decline All Orders",
                          message: "Are you sure you want to decline all selected pending orders?",
                          confirmText: "Decline All",
                          variant: "danger",
                        });
                        if (!ok) return;
                        const ids = activeOrders
                          .filter((o) => o.status === "pending" && batchSelected.has(o.id))
                          .map((o) => o.id);
                        for (const oid of ids) await updateStatus(oid, "cancelled");
                        setBatchSelected(new Set());
                        setBatchMode(false);
                      }}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600"
                    >
                      Decline All
                    </button>
                  )}
                  {activeOrders.some((o) => o.status === "accepted" && batchSelected.has(o.id)) && (
                    <button
                      onClick={async () => {
                        const ids = activeOrders
                          .filter((o) => o.status === "accepted" && batchSelected.has(o.id))
                          .map((o) => o.id);
                        for (const oid of ids)
                          await updateStatus(oid, "preparing", { estimated_prep_time: 15 });
                        setBatchSelected(new Set());
                        setBatchMode(false);
                      }}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                    >
                      Start All
                    </button>
                  )}
                </>
              )}
              <span className="text-xs font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
                Real-time
              </span>
            </div>
          </div>

          {activeOrders.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-8 text-center md:p-16">
              <span className="material-symbols-outlined mb-4 text-6xl text-[var(--color-outline-variant)]/60">
                check_circle
              </span>
              <p className="text-lg font-medium text-[var(--color-outline-variant)]">
                All caught up!
              </p>
              <p className="mt-1 text-sm text-[var(--color-outline-variant)]/60">
                Waiting for new orders...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {activeOrders.map((order) => {
                const actions = statusActions[order.status];
                return (
                  <div
                    key={order.id}
                    className={`rounded-3xl border bg-[var(--color-surface-container-lowest)] p-6 shadow-sm transition-all ${
                      batchSelected.has(order.id)
                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
                        : "border-[var(--color-border-subtle)] hover:shadow-md"
                    }`}
                  >
                    {batchMode && (
                      <div className="mb-3 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={batchSelected.has(order.id)}
                          onChange={() => {
                            const next = new Set(batchSelected);
                            if (next.has(order.id)) next.delete(order.id);
                            else next.add(order.id);
                            setBatchSelected(next);
                          }}
                          className="h-4 w-4 accent-[var(--color-primary)]"
                        />
                        <span className="text-xs text-[var(--color-outline)]">Select</span>
                      </div>
                    )}
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <div className="mb-1 flex items-center gap-3">
                          <span className="text-lg font-black text-[var(--color-on-surface)]">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase ${statusBadge[order.status] || "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"}`}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[var(--color-outline-variant)]">
                          {new Date(order.placed_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" • "}
                          {order.payment_method === "wallet" ? "Wallet" : "Online"}
                        </p>
                        {order.user_id && (
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              onClick={async () => {
                                const customerId = order.user_id;
                                if (!customerId) return;
                                const { data: pastOrders } = await supabase
                                  .from("orders")
                                  .select(
                                    "id, status, total_amount, placed_at, items:order_items(menu_item_id, quantity, unit_price)"
                                  )
                                  .eq("user_id", customerId)
                                  .eq("vendor_id", vendorId)
                                  .neq("id", order.id)
                                  .order("placed_at", { ascending: false })
                                  .limit(10);
                                setCustHistoryModal({
                                  userId: customerId,
                                  orders: pastOrders || [],
                                });
                              }}
                              className="text-[10px] font-bold text-[var(--color-primary)] hover:underline"
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
                              className="flex items-center gap-1 text-[10px] font-bold text-green-600 hover:underline"
                            >
                              <span className="material-symbols-outlined text-[12px]">call</span>
                              Call Customer
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-[var(--color-primary)]">
                          ₹{order.total_amount.toFixed(2)}
                        </p>
                        {order.delivery_address && (
                          <p className="mt-1 max-w-[160px] truncate text-[10px] text-[var(--color-outline-variant)]">
                            {order.delivery_address}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mb-6 space-y-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
                      {order.items?.map((item, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between text-sm">
                            <p className="font-bold text-[var(--color-on-surface)]">
                              <span className="mr-2 text-[var(--color-outline-variant)]">
                                {item.quantity}x
                              </span>
                              {menuItemNames.get(item.menu_item_id)?.name || "Unknown Item"}
                            </p>
                            <p className="font-medium text-[var(--color-outline)]">
                              ₹{(item.unit_price * item.quantity).toFixed(0)}
                            </p>
                          </div>
                          {item.special_notes && (
                            <p className="mt-0.5 ml-6 text-xs text-amber-600">
                              📝 {item.special_notes}
                            </p>
                          )}
                        </div>
                      ))}
                      {order.special_instructions && (
                        <div className="mt-3 border-t border-[var(--color-border-subtle)] pt-3">
                          <p className="text-xs text-[var(--color-outline)]">
                            <span className="font-bold">Note: </span>
                            {order.special_instructions}
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
                            className={`flex-1 ${action.color} rounded-xl py-4 font-bold text-white shadow-lg shadow-slate-200 transition-all active:scale-95 dark:shadow-none`}
                          >
                            {action.label}
                          </button>
                        ))
                      ) : order.status === "ready_for_pickup" ? (
                        <div className="bg-accent/10 text-accent border-accent/20 dark:bg-accent/20 dark:text-accent dark:border-accent/40 flex-1 rounded-xl border py-4 text-center text-sm font-bold">
                          <span className="material-symbols-outlined mr-1 align-middle text-lg">
                            pedal_bike
                          </span>
                          Waiting for Rider to Pick Up
                        </div>
                      ) : order.status === "on_the_way" ? (
                        <div className="flex-1 rounded-xl border border-cyan-200 bg-cyan-50 py-4 text-center text-sm font-bold text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300">
                          Out for Delivery — Rider on the Way
                        </div>
                      ) : null}
                      {order.delay_minutes && order.delay_minutes > 0 ? (
                        <div className="mt-2 flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                          <span className="material-symbols-outlined text-sm">warning</span>
                          Delayed — {order.delay_reason || "Running late"} (+{order.delay_minutes}{" "}
                          min)
                        </div>
                      ) : ["accepted", "preparing"].includes(order.status) ? (
                        <button
                          onClick={() => setDelayModal({ orderId: order.id })}
                          className="mt-2 w-full rounded-xl border border-orange-200 py-2 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-50"
                        >
                          <span className="material-symbols-outlined mr-1 align-middle text-sm">
                            schedule
                          </span>
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
                          className="rounded-xl border border-red-200 px-6 text-xs font-bold text-red-400 transition-colors hover:border-red-300 hover:text-red-600"
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
          <h2 className="mb-6 text-xl font-bold text-[var(--color-on-surface)]">
            Completed / Cancelled
          </h2>
          <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <caption className="sr-only">Past completed and cancelled orders</caption>
                <thead className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
                  <tr>
                    <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                      Order
                    </th>
                    <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                      Items
                    </th>
                    <th className="p-4 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                      Status
                    </th>
                    <th className="p-4 text-right text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                      Amount
                    </th>
                    <th className="p-4 text-right text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {pastOrders.slice(0, 15).map((order) => (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-[var(--color-surface-subtle)]"
                    >
                      <td className="p-4 text-xs font-bold text-[var(--color-on-surface)]">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="p-4 text-xs font-medium text-[var(--color-outline)]">
                        {order.items?.length || 0} items
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : order.status === "cancelled"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-xs font-black text-[var(--color-on-surface)]">
                        ₹{order.total_amount.toFixed(0)}
                      </td>
                      <td className="p-4 text-right text-xs text-[var(--color-outline-variant)]">
                        {new Date(order.placed_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDelayModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delay-modal-title"
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[var(--color-surface-container-lowest)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-orange-500">schedule</span>
              <div>
                <h3
                  id="delay-modal-title"
                  className="text-lg font-extrabold text-[var(--color-on-surface)]"
                >
                  Notify Delay
                </h3>
                <p className="text-xs text-[var(--color-outline)]">
                  Inform customer about the delay
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold tracking-wider text-[var(--color-on-surface-variant)] uppercase">
                  Delay (minutes)
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 30].map((m) => (
                    <button
                      key={m}
                      onClick={() => setDelayMinutes(m)}
                      className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
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
                <label className="mb-1 block text-xs font-bold tracking-wider text-[var(--color-on-surface-variant)] uppercase">
                  Reason (optional)
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {[
                    "High order volume",
                    "Staff shortage",
                    "Ingredient unavailable",
                    "Equipment issue",
                  ].map((r) => (
                    <button
                      key={r}
                      onClick={() => setDelayReason(r)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                        delayReason === r
                          ? "border border-orange-300 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                          : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-container)] text-[var(--color-outline)] hover:bg-[var(--color-surface-container-high)]"
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
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:ring-2 focus:ring-orange-300 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDelayModal(null)}
                  className="flex-1 rounded-xl border border-[var(--color-border-subtle)] py-3 text-sm font-bold text-[var(--color-on-surface-variant)] transition-all hover:bg-[var(--color-surface-subtle)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => notifyDelay(delayModal.orderId)}
                  className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-orange-600"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPrepTimeModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="prep-time-modal-title"
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[var(--color-surface-container-lowest)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-amber-500">timer</span>
              <div>
                <h3
                  id="prep-time-modal-title"
                  className="text-lg font-extrabold text-[var(--color-on-surface)]"
                >
                  Set Preparation Time
                </h3>
                <p className="text-xs text-[var(--color-outline)]">
                  How long will this order take to prepare?
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-3 block text-xs font-bold tracking-wider text-[var(--color-on-surface-variant)] uppercase">
                  Estimated time
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPrepTime(m)}
                      className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                        prepTime === m
                          ? "bg-amber-500 text-white shadow-md"
                          : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                      }`}
                    >
                      {m < 60 ? `${m}m` : `${Math.floor(m / 60)}h`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                <span className="material-symbols-outlined text-sm">info</span>
                <p>
                  The customer will see &ldquo;Estimated ready by{" "}
                  {new Date(Date.now() + prepTime * 60000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  &rdquo;
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setPrepTimeModal(null)}
                  className="flex-1 rounded-xl border border-[var(--color-border-subtle)] py-3 text-sm font-bold text-[var(--color-on-surface-variant)] transition-all hover:bg-[var(--color-surface-subtle)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateStatus(prepTimeModal.orderId, "preparing", {
                      estimated_prep_time: prepTime,
                    });
                    setPrepTimeModal(null);
                    setPrepTime(15);
                  }}
                  className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-amber-600"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCustHistoryModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cust-history-modal-title"
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[var(--color-surface-container-lowest)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3
                id="cust-history-modal-title"
                className="text-lg font-extrabold text-[var(--color-on-surface)]"
              >
                Customer Order History
              </h3>
              <button
                onClick={() => setCustHistoryModal(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container)]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            {custHistoryModal.orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-outline-variant)]">
                No previous orders from this customer
              </p>
            ) : (
              <div className="space-y-3">
                {custHistoryModal.orders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span className="text-xs font-bold text-[var(--color-on-surface)]">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          o.status === "delivered"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : o.status === "cancelled"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--color-outline)]">
                      {new Date(o.placed_at).toLocaleDateString()} • ₹{o.total_amount.toFixed(2)} •{" "}
                      {o.items?.length || 0} items
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCallMaskModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="call-mask-modal-title"
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[var(--color-surface-container-lowest)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3
                id="call-mask-modal-title"
                className="font-extrabold text-[var(--color-on-surface)]"
              >
                Connect Call
              </h3>
              <button
                onClick={() => setCallMaskModal(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container)]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <span
                  className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  call
                </span>
              </div>
              <div>
                <p className="text-sm text-[var(--color-outline)]">Masked Number</p>
                <p className="text-xl font-black tracking-wider text-[var(--color-on-surface)]">
                  {callMaskModal.maskedNumber}
                </p>
              </div>
              <p className="text-xs text-[var(--color-outline-variant)]">
                This masked number connects you to the customer without revealing either
                party&apos;s real number. Number copied to clipboard.
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                  <span className="material-symbols-outlined text-sm">info</span>
                  For production, configure Twilio proxy in your dashboard settings
                </p>
              </div>
              <button
                onClick={() => setCallMaskModal(null)}
                className="text-on-primary block w-full rounded-xl bg-[var(--color-primary)] py-3 font-bold transition-colors hover:bg-[var(--color-primary-dim)]"
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
