"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PRINTING_VENDOR_ID } from "@/lib/constants";

const supabase = useMemo(() => createClient(), []);

const KANBAN_COLUMNS = [
  { id: "pending", label: "Pending", icon: "schedule", color: "bg-amber-100 border-amber-300" },
  { id: "processing", label: "Printing", icon: "print", color: "bg-indigo-100 border-indigo-300" },
  { id: "ready_for_pickup", label: "Ready", icon: "inventory_2", color: "bg-blue-100 border-blue-300" },
  { id: "on_the_way", label: "Out for delivery", icon: "delivery_dining", color: "bg-cyan-100 border-cyan-300" },
  { id: "delivered", label: "Delivered", icon: "check_circle", color: "bg-emerald-100 border-emerald-300" },
  { id: "cancelled", label: "Cancelled", icon: "cancel", color: "bg-red-100 border-red-300" },
] as const;

export default function AdminPrintingKanban() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("vendor_id", PRINTING_VENDOR_ID)
        .order("placed_at", { ascending: false });
      if (error) {
        console.error("[kanban] Failed to load orders:", error);
      } else if (data) {
        setOrders(data);
      }
    } catch (e) {
      console.error("[kanban] Unexpected error loading orders:", e);
    }
    setLoading(false);
  }

  async function updateStatus(orderId: string, newStatus: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    if (newStatus === "delivered" || newStatus === "cancelled") {
      if (!confirm(`Are you sure you want to mark this order as ${newStatus.replace(/_/g, " ")}?`)) return;
    }

    // Optimistic update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) {
        console.error("[kanban] Failed to update status:", error);
        // Rollback on failure
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: order.status } : o)));
        return;
      }
      if (order.user_id) {
        const eventMap: Record<string, string> = {
          processing: "print_started",
          ready_for_pickup: "print_ready",
          on_the_way: "out_for_delivery",
          delivered: "delivered",
          cancelled: "print_failed",
        };
        const event = eventMap[newStatus];
        if (event) {
          try {
            await fetch("/api/printing/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: order.user_id, event, order_id: orderId }),
            });
          } catch (e) {
            console.warn("[kanban] Failed to send notification:", e);
          }
        }
      }
    } catch (e) {
      console.error("[kanban] Unexpected error updating status:", e);
      // Rollback on failure
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: order.status } : o)));
    }
  }

  const byColumn = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    for (const col of KANBAN_COLUMNS) grouped[col.id] = [];
    for (const o of orders) {
      if (grouped[o.status]) grouped[o.status].push(o);
    }
    return grouped;
  }, [orders]);

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggingId(orderId);
    e.dataTransfer.setData("text/plain", orderId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain") || draggingId;
    if (orderId) await updateStatus(orderId, colId);
    setDraggingId(null);
    setDragOverCol(null);
  };

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/printing" className="w-10 h-10 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Print Pipeline (Kanban)</h1>
          <p className="text-[var(--color-outline)] text-sm">Drag cards between columns to update status</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--color-outline)]">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {KANBAN_COLUMNS.map((col) => (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl border-2 ${col.color} p-3 min-h-[200px] transition-all ${
                dragOverCol === col.id ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-bold text-sm flex items-center gap-1.5 text-[var(--color-on-surface)]">
                  <span className="material-symbols-outlined text-base">{col.icon}</span>
                  {col.label}
                </h3>
                <span className="text-xs bg-[var(--color-surface-container-lowest)]/70 px-2 py-0.5 rounded-full font-bold text-[var(--color-on-surface)]">
                  {byColumn[col.id].length}
                </span>
              </div>

              <div className="space-y-2">
                {byColumn[col.id].map((order) => {
                  const item = order.order_items?.[0];
                  let settings: Record<string, any> = {};
                  try { if (item?.special_notes) settings = JSON.parse(item.special_notes); } catch { /* corrupted data, ignore */ }
                  const pageCount = settings.totalPages || settings.pages || 1;
                  const fileCount = settings.perFile?.length || settings.fileUrls?.length || settings.fileNames?.length || 1;

                  return (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      onClick={() => setSelectedOrder(order)}
                      className={`bg-[var(--color-surface-container-lowest)] rounded-xl p-3 shadow-sm border border-[var(--color-border-subtle)] cursor-move hover:shadow-md transition-shadow ${
                        draggingId === order.id ? "opacity-50" : ""
                      } ${order.priority > 0 ? "ring-2 ring-amber-300" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-[var(--color-on-surface)]">#{order.id.slice(0, 6)}</span>
                        {order.priority > 0 && (
                          <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">{item?.name || "Print order"}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[10px] bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] px-1.5 py-0.5 rounded font-bold">{fileCount} file{fileCount > 1 ? "s" : ""}</span>
                        <span className="text-[10px] bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] px-1.5 py-0.5 rounded font-bold">{pageCount} pg</span>
                        {settings.colorMode && (
                          <span className="text-[10px] bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] px-1.5 py-0.5 rounded font-bold">
                            {settings.colorMode === "bw" ? "B&W" : "Color"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
                        <span className="text-xs text-[var(--color-outline)]">
                          {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-sm font-black text-[var(--color-on-surface)]">₹{order.total_amount}</span>
                      </div>
                    </div>
                  );
                })}
                {byColumn[col.id].length === 0 && (
                  <div className="text-center text-xs text-[var(--color-outline-variant)] py-4 italic">Drop orders here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (() => {
        const selItem = selectedOrder.order_items?.[0];
        let selSettings: Record<string, any> = {};
        try { if (selItem?.special_notes) selSettings = JSON.parse(selItem.special_notes); } catch { /* corrupted data, ignore */ }
        const selFileNames: string[] = selSettings.fileNames || [];
        const selFileUrls: string[] = selSettings.fileUrls || [];
        const selFileStatuses: boolean[] = selSettings.fileStatuses || [];

        const nameMatch = (selItem?.name || "").match(/Print\s*\((\d+)pg.*?ETA\s*(\d+)m?\)/i);
        const fallbackPages = nameMatch?.[1] ? parseInt(nameMatch[1], 10) : null;
        const fallbackEta = nameMatch?.[2] ? parseInt(nameMatch[2], 10) : null;
        const hasAnySettings = selSettings.pages || selSettings.copies || selSettings.colorMode || selSettings.paperSize || fallbackPages;
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto" onClick={() => setSelectedOrder(null)}>
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 pb-0">
                <div>
                  <h3 className="font-bold text-lg">Order #{selectedOrder.id.slice(0, 8)}</h3>
                  <p className="text-sm text-[var(--color-outline)]">{new Date(selectedOrder.placed_at).toLocaleString("en-IN")} · ₹{selectedOrder.total_amount}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-11 h-11 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="p-5 space-y-4">
                {hasAnySettings && (
                  <div className="flex flex-wrap gap-1.5">
                    {(selSettings.pages || fallbackPages) && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">{selSettings.pages || fallbackPages} pages</span>}
                    {selSettings.copies && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">{selSettings.copies} copies</span>}
                    {selSettings.colorMode && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold capitalize">{selSettings.colorMode === "bw" ? "B&W" : "Color"}</span>}
                    {selSettings.paperSize && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase">{selSettings.paperSize}</span>}
                    {fallbackEta && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">ETA {fallbackEta}m</span>}
                  </div>
                )}

                {selFileNames.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-[var(--color-outline)] uppercase tracking-wider">Files</h4>
                    <div className="divide-y divide-[var(--color-border-subtle)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                      {selFileNames.map((name: string, fi: number) => {
                        const url = selFileUrls[fi] || "";
                        return (
                          <div key={fi} className="flex items-center gap-2 p-2.5 bg-[var(--color-surface-container-lowest)]">
                            <span className="material-symbols-outlined text-indigo-500 text-base shrink-0">description</span>
                            <span className="text-sm font-medium text-[var(--color-on-surface)] truncate flex-1 min-w-0">{name}</span>
                            {url && (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100">
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                              </a>
                            )}
                            {url && (
                              <a href={url} download={name} className="shrink-0 w-10 h-10 rounded-lg bg-[var(--color-surface-subtle)] text-[var(--color-on-surface-variant)] flex items-center justify-center hover:bg-[var(--color-surface-container)]">
                                <span className="material-symbols-outlined text-sm">download</span>
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selFileNames.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">folder_off</span>
                    <p className="text-xs text-amber-800">No files attached to this order. Contact the customer for the documents.</p>
                  </div>
                )}

                {selectedOrder.delivery_address && (
                  <div className="bg-[var(--color-surface-subtle)] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase tracking-wider mb-0.5">Delivery</p>
                    <p className="text-sm text-[var(--color-on-surface)]">{selectedOrder.delivery_address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
