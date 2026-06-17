"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorIdForUser, getVendorMenuItems } from "@/lib/vendor";
import { VendorTableSkeleton } from "@/components/vendor/VendorSkeleton";
import type { Order, OrderStatus } from "@/lib/types";
import OrderChatOverlay from "@/components/order/OrderChatOverlay";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";

type FilterStatus = "all" | "active" | "delivered" | "cancelled";

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
  const rejectReasons = ["Out of stock", "Too busy", "Store closing", "Item unavailable", "Other"];
  const { unreadByOrder } = useUnreadMessages(vendorUserId);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setVendorUserId(user.id);
    const id = await getVendorIdForUser();
    if (id) {
      setVendorId(id);
      loadOrders(id);
    }
    setLoading(false);
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

  const updateStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    const updateData: Record<string, unknown> = { status };
    if (status === "cancelled" && reason) {
      updateData.cancellation_reason = reason;
      updateData.cancelled_by = "vendor";
    }
    await supabase.from("orders").update(updateData).eq("id", orderId);
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
        active: orders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status)).length,
        delivered: orders.filter((o) => o.status === "delivered").length,
        cancelled: orders.filter((o) => ["cancelled", "refunded"].includes(o.status)).length,
      },
    };
  }, [orders, search, filter]);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight">Order Management</h1>
        <p className="text-[var(--color-outline)] mt-1">View and manage all your orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { key: "all", label: "Total", color: "text-[var(--color-on-surface)]" },
          { key: "active", label: "Active", color: "text-[var(--color-primary)]" },
          { key: "delivered", label: "Delivered", color: "text-green-600" },
          { key: "cancelled", label: "Cancelled", color: "text-red-600" },
        ] as const).map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border text-left transition-all ${
              filter === s.key ? "border-[var(--color-primary)] shadow-sm" : "border-[var(--color-border-subtle)] hover:border-[var(--color-outline-variant)]"
            }`}
          >
            <p className="text-sm text-[var(--color-outline)] font-medium">{s.label}</p>
            <p className={`text-3xl font-black ${s.color} mt-1`}>{statusCounts[s.key]}</p>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)] text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or address..."
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "delivered", "cancelled"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
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
          <div className="bg-[var(--color-surface-container-lowest)] border-2 border-dashed border-[var(--color-border-subtle)] rounded-3xl p-8 md:p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60 mb-4">receipt_long</span>
            <p className="text-[var(--color-outline-variant)] font-medium text-lg">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-sm border border-[var(--color-border-subtle)] hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-extrabold text-[var(--color-on-surface)]">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      order.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                      order.status === "accepted" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                      order.status === "preparing" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" :
                      order.status === "ready_for_pickup" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                      order.status === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                      order.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                      "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                    }`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-[var(--color-outline)]">
                    <span>{order.items?.length || 0} items</span>
                    <span>{new Date(order.placed_at).toLocaleDateString()} {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {order.delivery_address && <span className="truncate max-w-[200px]">{order.delivery_address}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {order.items?.slice(0, 4).map((item, i) => (
                      <span key={i} className="text-xs bg-[var(--color-surface-subtle)] px-2 py-1 rounded-full text-[var(--color-on-surface-variant)]">
                        {item.quantity}x {menuItemNames.get(item.menu_item_id)?.name || "Item"}
                      </span>
                    ))}
                    {(order.items?.length || 0) > 4 && (
                      <span className="text-xs text-[var(--color-outline-variant)]">+{order.items!.length - 4} more</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:text-right">
                  <div>
                    <p className="text-xl font-black text-[var(--color-primary)]">₹{order.total_amount.toFixed(2)}</p>
                    <p className="text-xs text-[var(--color-outline-variant)]">{order.payment_method}</p>
                  </div>
                  <button
                    onClick={() => setChatOrder(order)}
                    className="relative px-3 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold text-secondary hover:bg-secondary/5 transition-colors flex items-center gap-1"
                    title="Chat with customer"
                    aria-label="Chat with customer"
                  >
                    <span className="material-symbols-outlined text-base">chat_bubble</span>
                    {(unreadByOrder[order.id] || 0) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                        {unreadByOrder[order.id] > 9 ? "9+" : unreadByOrder[order.id]}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-subtle)] transition-colors"
                  >
                    {selectedOrder?.id === order.id ? "Close" : "Manage"}
                  </button>
                </div>
              </div>

              {/* Expanded Management Panel */}
              {selectedOrder?.id === order.id && (
                <div className="mt-6 pt-6 border-t border-[var(--color-border-subtle)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-on-surface)] mb-2">Order Items</h4>
                      <div className="space-y-2 bg-[var(--color-surface-subtle)] p-4 rounded-xl">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-[var(--color-on-surface)]">
                              <span className="text-[var(--color-outline-variant)] mr-1">{item.quantity}x</span>
                              {menuItemNames.get(item.menu_item_id)?.name || "Item"}
                            </span>
                            <span className="font-bold text-[var(--color-on-surface)]">₹{(item.unit_price * item.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm pt-2 border-t border-[var(--color-border-subtle)]">
                          <span className="font-bold text-[var(--color-on-surface)]">Total</span>
                          <span className="font-bold text-[var(--color-primary)]">₹{order.total_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {order.special_instructions && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-[var(--color-on-surface)] mb-1">Special Instructions</h4>
                          <p className="text-sm text-[var(--color-on-surface-variant)] bg-[var(--color-surface-subtle)] p-3 rounded-xl">{order.special_instructions}</p>
                        </div>
                      )}
                      {order.delivery_address && (
                        <div>
                          <h4 className="text-sm font-bold text-[var(--color-on-surface)] mb-1">Delivery Address</h4>
                          <p className="text-sm text-[var(--color-on-surface-variant)] bg-[var(--color-surface-subtle)] p-3 rounded-xl">{order.delivery_address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {order.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(order.id, "accepted")} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors">Accept</button>
                        <button onClick={() => setShowRejectModal(order.id)} className="px-6 py-3 border border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">Decline</button>
                      </>
                    )}
                    {order.status === "accepted" && (
                      <button onClick={() => updateStatus(order.id, "preparing")} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors">Start Preparing</button>
                    )}
                    {order.status === "preparing" && (
                      <button onClick={() => updateStatus(order.id, "ready_for_pickup")} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">Mark Ready for Pickup</button>
                    )}
                    {order.status === "ready_for_pickup" && (
                      <div className="px-6 py-3 bg-purple-50 text-purple-700 rounded-xl font-bold text-sm border border-purple-200">
                        <span className="material-symbols-outlined align-middle text-lg mr-1">pedal_bike</span>
                        Waiting for Rider
                      </div>
                    )}
                    {order.status === "on_the_way" && (
                      <div className="px-6 py-3 bg-cyan-50 text-cyan-700 rounded-xl font-bold text-sm border border-cyan-200">
                        <span className="material-symbols-outlined align-middle text-lg mr-1">delivery_truck</span>
                        Out for Delivery
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reject Order Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRejectModal(null)} role="dialog" aria-modal="true" aria-labelledby="reject-modal-title-orders">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-sm rounded-3xl p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <h2 id="reject-modal-title-orders" className="text-xl font-extrabold text-[var(--color-on-surface)] mb-4">Decline Order</h2>
            <p className="text-sm text-[var(--color-outline)] mb-4">Select a reason for declining this order:</p>
            <div className="space-y-2 mb-6" role="radiogroup" aria-label="Rejection reason">
              {rejectReasons.map((reason) => (
                <label key={reason} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${rejectReason === reason ? "bg-red-50 border border-red-200" : "bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-container)]"}`}>
                  <input
                    type="radio"
                    name="reject-reason-orders"
                    value={reason}
                    checked={rejectReason === reason}
                    onChange={() => setRejectReason(reason)}
                    className="accent-red-500"
                  />
                  <span className="text-sm font-medium text-[var(--color-on-surface)]">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(null)} className="flex-1 py-3 bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] font-bold rounded-xl hover:bg-[var(--color-surface-container-high)] transition-colors">
                Cancel
              </button>
              <button onClick={async () => { if (!rejectReason) return; await updateStatus(showRejectModal!, "cancelled", rejectReason); setShowRejectModal(null); setRejectReason(""); }} disabled={!rejectReason} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
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
