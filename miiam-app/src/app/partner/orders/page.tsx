"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorIdForUser, getVendorMenuItems } from "@/lib/vendor";
import { restoreStock } from "@/lib/stock";
import { VendorTableSkeleton } from "@/components/vendor/VendorSkeleton";
import type { Order, OrderStatus } from "@/lib/types";
import OrderChatOverlay from "@/components/order/OrderChatOverlay";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";
import logger from "@/lib/logger";

type FilterStatus = "all" | "active" | "delivered" | "cancelled";
type TabType = "orders" | "services";

export default function VendorOrders() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [menuItemNames, setMenuItemNames] = useState<Map<string, { name: string }>>(new Map());
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [vendorUserId, setVendorUserId] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [serviceBookings, setServiceBookings] = useState<
    {
      id: string;
      status: string;
      scheduled_date: string | null;
      scheduled_time: string | null;
      sub_service: string | null;
      service_type: string | null;
      user_name: string | null;
      user_phone: string | null;
      address: string | null;
      amount: number | null;
      technician_name: string | null;
      technician_phone: string | null;
    }[]
  >([]);
  const [serviceBookingsLoading, setServiceBookingsLoading] = useState(false);
  const rejectReasons = ["Out of stock", "Too busy", "Store closing", "Item unavailable", "Other"];
  const { unreadByOrder } = useUnreadMessages(vendorUserId);

  useEffect(() => {
    if (!showRejectModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowRejectModal(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showRejectModal]);

  useEffect(() => {
    init().catch(() => setLoading(false));
  }, []);

  async function init() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setVendorUserId(user.id);
      const id = await getVendorIdForUser();
      if (id) {
        setVendorId(id);
        await Promise.all([loadOrders(id), loadServiceBookings(id)]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders(vId: string) {
    const { data } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("vendor_id", vId)
      .order("placed_at", { ascending: false });
    if (data) {
      setOrders(data);
      const names = await getVendorMenuItems(vId);
      setMenuItemNames(names);
    }
  }

  async function loadServiceBookings(vId: string) {
    setServiceBookingsLoading(true);
    const { data } = await supabase
      .from("service_bookings")
      .select(
        "id, status, scheduled_date, scheduled_time, sub_service, service_type, user_name, user_phone, address, amount, technician_name, technician_phone"
      )
      .eq("provider_id", vId)
      .order("created_at", { ascending: false });
    if (data) setServiceBookings(data);
    setServiceBookingsLoading(false);
  }

  async function updateServiceStatus(bookingId: string, status: string) {
    const { error } = await supabase
      .from("service_bookings")
      .update({ status })
      .eq("id", bookingId);
    if (error) return;
    setServiceBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
  }

  function navigateToAddress(address: string | null) {
    if (!address) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      "_blank",
      "noopener"
    );
  }

  const updateStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    const updateData: Record<string, unknown> = { status };
    if (status === "cancelled" && reason) {
      updateData.cancellation_reason = reason;
      updateData.cancelled_by = "vendor";
    }
    const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
    if (error) {
      logger.error({ err: error }, "Failed to update order status");
      return;
    }
    if (status === "cancelled") {
      await restoreStock(orderId);
    }
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
    if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status });
  };

  const { filteredOrders, statusCounts } = useMemo(() => {
    const filtered = orders.filter((o) => {
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
    return {
      filteredOrders: filtered,
      statusCounts: {
        all: orders.length,
        active: orders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status))
          .length,
        delivered: orders.filter((o) => o.status === "delivered").length,
        cancelled: orders.filter((o) => ["cancelled", "refunded"].includes(o.status)).length,
      },
    };
  }, [orders, search, filter]);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Order Management
        </h1>
        <p className="mt-1 text-[var(--color-outline)]">View and manage all your orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border-subtle)] pb-px">
        {[
          { key: "orders" as TabType, label: "Orders" },
          { key: "services" as TabType, label: "Services" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-t-xl px-5 py-3 text-sm font-bold transition-all ${
              activeTab === tab.key
                ? "text-on-primary bg-[var(--color-primary)]"
                : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Services Tab */}
      {activeTab === "services" && (
        <div className="space-y-4">
          {serviceBookingsLoading ? (
            <VendorTableSkeleton />
          ) : serviceBookings.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-8 text-center md:p-16">
              <span className="material-symbols-outlined mb-4 text-6xl text-[var(--color-outline-variant)]/60">
                event_available
              </span>
              <p className="text-lg font-medium text-[var(--color-outline-variant)]">
                No service bookings
              </p>
              <p className="text-center text-sm text-[var(--color-outline-variant)]">
                Service bookings will appear here
              </p>
            </div>
          ) : (
            serviceBookings.map((sb) => (
              <div
                key={sb.id}
                className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="font-extrabold text-[var(--color-on-surface)]">
                        #{sb.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                          sb.status === "pending"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : sb.status === "confirmed"
                              ? "bg-deal/10 text-deal"
                              : sb.status === "in_progress"
                                ? "bg-deal/10 text-deal"
                                : sb.status === "completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : sb.status === "cancelled"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                        }`}
                      >
                        {sb.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-[var(--color-outline)]">
                      {(sb.sub_service || sb.service_type) && (
                        <span className="capitalize">{sb.sub_service || sb.service_type}</span>
                      )}
                      {sb.scheduled_date && (
                        <span>
                          {new Date(sb.scheduled_date + "T00:00:00").toLocaleDateString()}{" "}
                          {sb.scheduled_time || ""}
                        </span>
                      )}
                      {sb.user_name && <span>{sb.user_name}</span>}
                    </div>
                    {sb.address && (
                      <p className="mt-1 max-w-[400px] truncate text-xs text-[var(--color-outline-variant)]">
                        {sb.address}
                      </p>
                    )}
                    {sb.technician_name && (
                      <p className="mt-1 text-xs font-bold text-green-700 dark:text-green-400">
                        Tech: {sb.technician_name}
                        {sb.technician_phone ? ` • ${sb.technician_phone}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {sb.amount != null && (
                      <p className="text-xl font-black text-[var(--color-primary)]">₹{sb.amount}</p>
                    )}
                    {sb.user_phone && (
                      <a
                        href={`tel:${sb.user_phone}`}
                        className="text-xs font-bold text-[var(--color-outline-variant)] hover:text-[var(--color-primary)]"
                      >
                        {sb.user_phone}
                      </a>
                    )}
                  </div>
                </div>
                {/* Job actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {sb.status === "pending" && (
                    <button
                      onClick={() => updateServiceStatus(sb.id, "confirmed")}
                      className="rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-700"
                    >
                      Accept
                    </button>
                  )}
                  {sb.status === "confirmed" && (
                    <button
                      onClick={() => updateServiceStatus(sb.id, "in_progress")}
                      className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700"
                    >
                      Start Job
                    </button>
                  )}
                  {sb.status === "in_progress" && (
                    <button
                      onClick={() => updateServiceStatus(sb.id, "completed")}
                      className="bg-primary text-on-primary hover:bg-primary-hover rounded-xl px-4 py-2 text-xs font-bold transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                  {["pending", "confirmed", "in_progress"].includes(sb.status) && (
                    <>
                      {sb.address && (
                        <button
                          onClick={() => navigateToAddress(sb.address)}
                          className="flex items-center gap-1 rounded-xl border border-[var(--color-border-subtle)] px-4 py-2 text-xs font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-subtle)]"
                        >
                          <span className="material-symbols-outlined text-sm">navigation</span>
                          Navigate
                        </button>
                      )}
                      <a
                        href={`/tech/share-location/${sb.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-xl border border-green-200 px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-50"
                      >
                        <span className="material-symbols-outlined text-sm">gps_fixed</span>
                        Share Live Location
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                { key: "all", label: "Total", color: "text-[var(--color-on-surface)]" },
                { key: "active", label: "Active", color: "text-[var(--color-primary)]" },
                {
                  key: "delivered",
                  label: "Delivered",
                  color: "text-green-600 dark:text-green-400",
                },
                { key: "cancelled", label: "Cancelled", color: "text-red-600 dark:text-red-400" },
              ] as const
            ).map((s) => (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                aria-pressed={filter === s.key}
                className={`rounded-2xl border bg-[var(--color-surface-container-lowest)] p-5 text-left transition-all ${
                  filter === s.key
                    ? "border-[var(--color-primary)] shadow-sm"
                    : "border-[var(--color-border-subtle)] hover:border-[var(--color-outline-variant)]"
                }`}
              >
                <p className="text-sm font-medium text-[var(--color-outline)]">{s.label}</p>
                <p className={`text-3xl font-black ${s.color} mt-1`}>{statusCounts[s.key]}</p>
              </button>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4">
            <div className="relative min-w-[200px] flex-1">
              <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-lg text-[var(--color-outline-variant)]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order ID or address..."
                className="w-full rounded-xl border border-[var(--color-border-subtle)] py-2.5 pr-4 pl-10 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "active", "delivered", "cancelled"] as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    filter === f
                      ? "text-on-primary bg-[var(--color-primary)]"
                      : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
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
              <VendorTableSkeleton />
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-8 text-center md:p-16">
                <span className="material-symbols-outlined mb-4 text-6xl text-[var(--color-outline-variant)]/60">
                  receipt_long
                </span>
                <p className="text-lg font-medium text-[var(--color-outline-variant)]">
                  No orders found
                </p>
                <p className="text-center text-sm text-[var(--color-outline-variant)]">
                  Try adjusting your filters or check back later
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="font-extrabold text-[var(--color-on-surface)]">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                            order.status === "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              : order.status === "accepted"
                                ? "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal"
                                : order.status === "preparing"
                                  ? "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal"
                                  : order.status === "ready_for_pickup"
                                    ? "bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent"
                                    : order.status === "shopping" || order.status === "picked_up"
                                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                                      : order.status === "delivered"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                        : order.status === "cancelled"
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                          : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                          }`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-[var(--color-outline)]">
                        <span>{order.items?.length || 0} items</span>
                        <span>
                          {new Date(order.placed_at).toLocaleDateString()}{" "}
                          {new Date(order.placed_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {order.delivery_address && (
                          <span className="max-w-[200px] truncate">{order.delivery_address}</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {order.items?.slice(0, 4).map((item, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-1 text-xs text-[var(--color-on-surface-variant)]"
                          >
                            {item.quantity}x {menuItemNames.get(item.menu_item_id)?.name || "Item"}
                          </span>
                        ))}
                        {(order.items?.length || 0) > 4 && (
                          <span className="text-xs text-[var(--color-outline-variant)]">
                            +{order.items!.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:text-right">
                      <div>
                        <p className="text-xl font-black text-[var(--color-primary)]">
                          ₹{order.total_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-[var(--color-outline-variant)]">
                          {order.payment_method}
                        </p>
                      </div>
                      <button
                        onClick={() => setChatOrder(order)}
                        className="text-secondary hover:bg-secondary/5 relative flex items-center gap-1 rounded-xl border border-[var(--color-border-subtle)] px-3 py-2 text-sm font-bold transition-colors"
                        title="Chat with customer"
                        aria-label="Chat with customer"
                      >
                        <span className="material-symbols-outlined text-base">chat_bubble</span>
                        {(unreadByOrder[order.id] || 0) > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-md">
                            {unreadByOrder[order.id] > 9 ? "9+" : unreadByOrder[order.id]}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setSelectedOrder(selectedOrder?.id === order.id ? null : order)
                        }
                        className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-bold text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                      >
                        {selectedOrder?.id === order.id ? "Close" : "Manage"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Management Panel */}
                  {selectedOrder?.id === order.id && (
                    <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-6">
                      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <h4 className="mb-2 text-sm font-bold text-[var(--color-on-surface)]">
                            Order Items
                          </h4>
                          <div className="space-y-2 rounded-xl bg-[var(--color-surface-subtle)] p-4">
                            {order.items?.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-[var(--color-on-surface)]">
                                  <span className="mr-1 text-[var(--color-outline-variant)]">
                                    {item.quantity}x
                                  </span>
                                  {menuItemNames.get(item.menu_item_id)?.name || "Item"}
                                </span>
                                <span className="font-bold text-[var(--color-on-surface)]">
                                  ₹{(item.unit_price * item.quantity).toFixed(0)}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between border-t border-[var(--color-border-subtle)] pt-2 text-sm">
                              <span className="font-bold text-[var(--color-on-surface)]">
                                Total
                              </span>
                              <span className="font-bold text-[var(--color-primary)]">
                                ₹{order.total_amount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          {order.special_instructions && (
                            <div className="mb-4">
                              <h4 className="mb-1 text-sm font-bold text-[var(--color-on-surface)]">
                                Special Instructions
                              </h4>
                              <p className="rounded-xl bg-[var(--color-surface-subtle)] p-3 text-sm text-[var(--color-on-surface-variant)]">
                                {order.special_instructions}
                              </p>
                            </div>
                          )}
                          {order.delivery_address && (
                            <div>
                              <h4 className="mb-1 text-sm font-bold text-[var(--color-on-surface)]">
                                Delivery Address
                              </h4>
                              <p className="rounded-xl bg-[var(--color-surface-subtle)] p-3 text-sm text-[var(--color-on-surface-variant)]">
                                {order.delivery_address}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(order.id, "accepted")}
                              className="rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => setShowRejectModal(order.id)}
                              className="rounded-xl border border-red-200 px-6 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {order.status === "accepted" && (
                          <button
                            onClick={() => updateStatus(order.id, "preparing")}
                            className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-700"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === "preparing" && (
                          <button
                            onClick={() => updateStatus(order.id, "ready_for_pickup")}
                            className="bg-primary text-on-primary hover:bg-primary-hover rounded-xl px-6 py-3 text-sm font-bold transition-colors"
                          >
                            Mark Ready for Pickup
                          </button>
                        )}
                        {order.status === "ready_for_pickup" && (
                          <div className="bg-accent/10 text-accent border-accent/20 dark:bg-accent/20 dark:text-accent dark:border-accent/40 rounded-xl border px-6 py-3 text-sm font-bold">
                            <span className="material-symbols-outlined mr-1 align-middle text-lg">
                              pedal_bike
                            </span>
                            Waiting for Rider
                          </div>
                        )}
                        {["shopping", "picked_up", "on_the_way"].includes(order.status) && (
                          <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-6 py-3 text-sm font-bold text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300">
                            <span className="material-symbols-outlined mr-1 align-middle text-lg">
                              delivery_truck
                            </span>
                            {order.status === "picked_up"
                              ? "Rider picked up — On the way!"
                              : "Out for Delivery"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Reject Order Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowRejectModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title-orders"
        >
          <div
            className="m-4 w-full max-w-sm rounded-3xl bg-[var(--color-surface-container-lowest)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="reject-modal-title-orders"
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
                    name="reject-reason-orders"
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
                onClick={async () => {
                  if (!rejectReason) return;
                  await updateStatus(showRejectModal!, "cancelled", rejectReason);
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                disabled={!rejectReason}
                className="flex-1 rounded-xl bg-red-500 py-3 font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {chatOrder && vendorUserId && (
        <OrderChatOverlay
          orderId={chatOrder.id}
          currentUserId={vendorUserId}
          senderType="vendor"
          thread="user-vendor"
          otherName={chatOrder.customer_name || `Customer ${chatOrder.user_id?.slice(0, 6) || ""}`}
          onClose={() => setChatOrder(null)}
        />
      )}
    </div>
  );
}
