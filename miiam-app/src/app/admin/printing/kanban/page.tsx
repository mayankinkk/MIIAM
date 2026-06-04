"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PRINTING_VENDOR_ID } from "@/lib/constants";

const supabase = createClient();

const KANBAN_COLUMNS = [
  { id: "pending", label: "Pending", icon: "schedule", color: "bg-amber-100 border-amber-300" },
  { id: "processing", label: "Printing", icon: "print", color: "bg-indigo-100 border-indigo-300" },
  { id: "ready_for_pickup", label: "Ready", icon: "inventory_2", color: "bg-blue-100 border-blue-300" },
  { id: "on_the_way", label: "Out for delivery", icon: "delivery_dining", color: "bg-cyan-100 border-cyan-300" },
  { id: "delivered", label: "Delivered", icon: "check_circle", color: "bg-emerald-100 border-emerald-300" },
] as const;

export default function AdminPrintingKanban() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("vendor_id", PRINTING_VENDOR_ID)
      .order("placed_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  async function updateStatus(orderId: string, newStatus: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
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
        await fetch("/api/printing/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: order.user_id, event, order_id: orderId }),
        });
      }
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
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
        <Link href="/admin/printing" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-800">Print Pipeline (Kanban)</h1>
          <p className="text-slate-500 text-sm">Drag cards between columns to update status</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                <h3 className="font-bold text-sm flex items-center gap-1.5 text-slate-700">
                  <span className="material-symbols-outlined text-base">{col.icon}</span>
                  {col.label}
                </h3>
                <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full font-bold text-slate-700">
                  {byColumn[col.id].length}
                </span>
              </div>

              <div className="space-y-2">
                {byColumn[col.id].map((order) => {
                  const item = order.order_items?.[0];
                  let settings: Record<string, any> = {};
                  try { if (item?.special_notes) settings = JSON.parse(item.special_notes); } catch {}
                  const pageCount = settings.totalPages || settings.pages || 1;
                  const fileCount = settings.perFile?.length || settings.fileUrls?.length || settings.fileNames?.length || 1;

                  return (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      className={`bg-white rounded-xl p-3 shadow-sm border border-slate-100 cursor-move hover:shadow-md transition-shadow ${
                        draggingId === order.id ? "opacity-50" : ""
                      } ${order.priority > 0 ? "ring-2 ring-amber-300" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-slate-800">#{order.id.slice(0, 6)}</span>
                        {order.priority > 0 && (
                          <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-700 truncate">{item?.name || "Print order"}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">{fileCount} file{fileCount > 1 ? "s" : ""}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">{pageCount} pg</span>
                        {settings.colorMode && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                            {settings.colorMode === "bw" ? "B&W" : "Color"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">
                          {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-sm font-black text-slate-800">₹{order.total_amount}</span>
                      </div>
                    </div>
                  );
                })}
                {byColumn[col.id].length === 0 && (
                  <div className="text-center text-xs text-slate-400 py-4 italic">Drop orders here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
