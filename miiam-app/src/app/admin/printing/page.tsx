"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { PRINTING_VENDOR_ID } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";
import { getPrintingPricing, savePrintingPricing, type PrintingPricing } from "@/lib/printing-pricing";
import {
  ADDON_CATALOG,
  DEFAULT_ADDON_PRICING,
  getAddOnPricing,
  saveAddOnPricing,
  type AddOnPricing,
} from "@/lib/printing-addons";
import ServicesCatalogPanel from "@/components/admin/ServicesCatalogPanel";

const supabase = createClient();

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["on_the_way", "cancelled"],
  on_the_way: ["delivered", "cancelled"],
  delivered: ["refunded"],
  cancelled: ["refunded"],
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-indigo-100 text-indigo-700",
  ready_for_pickup: "bg-blue-100 text-blue-700",
  on_the_way: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminPrintingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [pricing, setPricing] = useState<PrintingPricing>(getPrintingPricing());
  const [showAddons, setShowAddons] = useState(false);
  const [addOnPricing, setAddOnPricing] = useState<AddOnPricing>(getAddOnPricing());
  const [showServicesCatalog, setShowServicesCatalog] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [page, setPage] = useState(1);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [signingUrls, setSigningUrls] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSavePricing = () => {
    savePrintingPricing(pricing);
    setShowPricing(false);
  };

  const handleSaveAddons = () => {
    saveAddOnPricing(addOnPricing);
    setShowAddons(false);
  };

  async function fetchSignedUrls(urls: string[]) {
    const uniqueUrls = [...new Set(urls.filter(Boolean))];
    if (uniqueUrls.length === 0) return;
    setSigningUrls(true);
    try {
      const res = await fetch("/api/printing/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: uniqueUrls }),
      });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        for (const item of data.urls) {
          if (item.signed) map[item.original] = item.signed;
        }
        setSignedUrls((prev) => ({ ...prev, ...map }));
      }
    } catch (e) {
      console.error("[admin-printing] Failed to fetch signed URLs:", e);
    }
    setSigningUrls(false);
  }

  function handleSelectOrder(order: any) {
    setSelectedOrder(order);
    const item = order.order_items?.[0];
    let settings: Record<string, any> = {};
                try { if (item?.special_notes) settings = JSON.parse(item.special_notes); } catch { /* corrupted data, ignore */ }
    const fileUrls: string[] = settings.fileUrls || [];
    if (fileUrls.length > 0) {
      fetchSignedUrls(fileUrls);
    }
  }

  async function loadOrders() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("vendor_id", PRINTING_VENDOR_ID)
        .order("placed_at", { ascending: false });
      if (error) {
        console.error("[admin-printing] Failed to load orders:", error);
      } else if (data) {
        setOrders(data);
      }
    } catch (e) {
      console.error("[admin-printing] Unexpected error loading orders:", e);
    }
    setLoading(false);
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      const currentOrder = orders.find(o => o.id === orderId);
      if (currentOrder && VALID_TRANSITIONS[currentOrder.status] && !VALID_TRANSITIONS[currentOrder.status].includes(status)) {
        useToastStore.getState().addToast(`Cannot change status from "${currentOrder.status.replace(/_/g, " ")}" to "${status.replace(/_/g, " ")}".`, "error");
        return;
      }
      const { data: order } = await supabase.from("orders").select("user_id").eq("id", orderId).single();
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) {
        console.error("[admin-printing] Failed to update order status:", error);
        useToastStore.getState().addToast("Failed to update status. Please try again.", "error");
        return;
      }
      if (order?.user_id) {
        const notifMap: Record<string, { title: string; body: string }> = {
          processing: { title: "Printing in Progress 🖨️", body: "Your print order is being processed and will be ready soon." },
          ready_for_pickup: { title: "Print Order Ready 📦", body: "Your prints are ready! Waiting for rider pickup." },
          on_the_way: { title: "Print Order On the Way 🛵", body: "Your prints are on their way!" },
          delivered: { title: "Print Delivered ✅", body: "Your prints have been delivered. Enjoy!" },
          cancelled: { title: "Print Order Cancelled ❌", body: "Your print order has been cancelled." },
        };
        const notif = notifMap[status];
        if (notif) {
          try {
            await fetch("/api/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: order.user_id, ...notif, type: "order" }),
            });
          } catch (e) {
            console.warn("[admin-printing] Failed to send notification:", e);
          }
        }
        try {
          await fetch("/api/emails/order-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status }) });
        } catch (e) {
          console.warn("[admin-printing] Failed to send email:", e);
        }
      }
      loadOrders();
      setSelectedOrder(null);
    } catch (e) {
      console.error("[admin-printing] Unexpected error updating status:", e);
      useToastStore.getState().addToast("An unexpected error occurred. Please try again.", "error");
    }
  }

  async function toggleFilePrinted(orderId: string, fileIndex: number, currentSettings: any) {
    const fileStatuses = currentSettings.fileStatuses || currentSettings.fileUrls?.map(() => false) || [];
    fileStatuses[fileIndex] = !fileStatuses[fileIndex];
    const updated = { ...currentSettings, fileStatuses };
    const { data: items } = await supabase.from("order_items").select("id").eq("order_id", orderId);
    if (items?.[0]) {
      await supabase.from("order_items").update({ special_notes: JSON.stringify(updated) }).eq("id", items[0].id);
    }
    loadOrders();
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const paginatedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.placed_at).toDateString() === todayStr);
  const bwOrders = orders.filter(o => {
    const item = o.order_items?.[0];
    try { const s = JSON.parse(item?.special_notes || "{}"); return s.colorMode === "bw"; } catch { return false; }
  });
  const colorOrders = orders.filter(o => {
    const item = o.order_items?.[0];
    try { const s = JSON.parse(item?.special_notes || "{}"); return s.colorMode === "color"; } catch { return false; }
  });
  const a4Orders = orders.filter(o => {
    const item = o.order_items?.[0];
    try { const s = JSON.parse(item?.special_notes || "{}"); return s.paperSize === "a4"; } catch { return false; }
  });
  const a3Orders = orders.filter(o => {
    const item = o.order_items?.[0];
    try { const s = JSON.parse(item?.special_notes || "{}"); return s.paperSize === "a3"; } catch { return false; }
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending" || o.status === "processing").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
    today: todayOrders.length,
    bw: bwOrders.length,
    color: colorOrders.length,
    a4: a4Orders.length,
    a3: a3Orders.length,
    avgOrderValue: orders.length > 0 ? (orders.reduce((s, o) => s + (o.total_amount || 0), 0) / orders.length).toFixed(0) : "0",
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Print Store Orders</h1>
          <p className="text-[var(--color-outline)] text-sm">Manage print delivery orders</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/printing/kanban"
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100"
          >
            <span className="material-symbols-outlined text-base">view_kanban</span>
            Kanban
          </Link>
          <Link
            href="/admin/printing/analytics"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100"
          >
            <span className="material-symbols-outlined text-base">monitoring</span>
            Analytics
          </Link>
        </div>
      </div>

      {/* Pricing Settings */}
      <div className="mb-4">
        <button onClick={() => setShowPricing(!showPricing)} className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]">
          <span className="material-symbols-outlined text-lg">payments</span>
          Pricing Settings
          <span className="material-symbols-outlined text-sm">{showPricing ? "expand_less" : "expand_more"}</span>
        </button>
        {showPricing && (
          <div className="mt-2 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] p-4 max-w-md space-y-3">
            {(["bwPerPage", "colorPerPage", "glossySurcharge", "a3Surcharge"] as const).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm font-bold text-[var(--color-on-surface-variant)] capitalize">{key.replace(/([A-Z])/g, " $1")} (₹)</label>
                <input type="number" value={pricing[key]} onChange={(e) => setPricing({ ...pricing, [key]: Math.max(0, parseInt(e.target.value) || 0) })} className="w-24 px-3 py-1.5 border border-[var(--color-border-subtle)] rounded-lg text-sm text-right" />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={handleSavePricing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">Save</button>
              <button onClick={() => { setPricing(getPrintingPricing()); setShowPricing(false); }} className="px-4 py-2 bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] rounded-lg text-sm font-bold">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Add-on & Rush Pricing */}
      <div className="mb-4">
        <button onClick={() => setShowAddons(!showAddons)} className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]">
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Add-on & rush pricing
          <span className="material-symbols-outlined text-sm">{showAddons ? "expand_less" : "expand_more"}</span>
        </button>
        {showAddons && (
          <div className="mt-2 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] p-4 max-w-2xl space-y-4">
            <div>
              <p className="text-xs font-bold text-[var(--color-outline)] uppercase tracking-widest mb-2">Rush tier multipliers</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-[var(--color-on-surface-variant)]">Rush 30-min (×)</label>
                  <input
                    type="number"
                    step="0.05"
                    min={1}
                    value={addOnPricing.rush30Multiplier}
                    onChange={(e) => setAddOnPricing({ ...addOnPricing, rush30Multiplier: Math.max(1, parseFloat(e.target.value) || 1) })}
                    className="w-24 px-3 py-1.5 border border-[var(--color-border-subtle)] rounded-lg text-sm text-right"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-[var(--color-on-surface-variant)]">Rush 15-min (×)</label>
                  <input
                    type="number"
                    step="0.05"
                    min={1}
                    value={addOnPricing.rush15Multiplier}
                    onChange={(e) => setAddOnPricing({ ...addOnPricing, rush15Multiplier: Math.max(1, parseFloat(e.target.value) || 1) })}
                    className="w-24 px-3 py-1.5 border border-[var(--color-border-subtle)] rounded-lg text-sm text-right"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[var(--color-outline)] uppercase tracking-widest mb-2">Add-on prices (₹)</p>
              <div className="grid grid-cols-2 gap-2">
                {ADDON_CATALOG.map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <label className="text-xs text-[var(--color-on-surface-variant)] truncate pr-2">{a.label} {a.unitLabel}</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      value={addOnPricing[a.pricingKey] as number}
                      onChange={(e) =>
                        setAddOnPricing({
                          ...addOnPricing,
                          [a.pricingKey]: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-20 px-2 py-1 border border-[var(--color-border-subtle)] rounded-lg text-xs text-right"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSaveAddons} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">Save</button>
              <button onClick={() => { setAddOnPricing(getAddOnPricing()); setShowAddons(false); }} className="px-4 py-2 bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] rounded-lg text-sm font-bold">Cancel</button>
              <button
                onClick={() => setAddOnPricing(DEFAULT_ADDON_PRICING)}
                className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold"
              >
                Reset to defaults
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Services Catalog */}
      <div className="mb-4">
        <button onClick={() => setShowServicesCatalog(!showServicesCatalog)} className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]">
          <span className="material-symbols-outlined text-lg">dashboard_customize</span>
          Services catalog
          <span className="material-symbols-outlined text-sm">{showServicesCatalog ? "expand_less" : "expand_more"}</span>
        </button>
        <ServicesCatalogPanel open={showServicesCatalog} onClose={() => setShowServicesCatalog(false)} />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-xs font-bold">TOTAL</p>
          <p className="text-2xl font-black text-[var(--color-on-surface)] mt-1">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-yellow-600 text-xs font-bold">PENDING</p>
          <p className="text-2xl font-black text-yellow-700 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <p className="text-green-600 text-xs font-bold">DELIVERED</p>
          <p className="text-2xl font-black text-green-700 mt-1">{stats.delivered}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <p className="text-red-600 text-xs font-bold">CANCELLED</p>
          <p className="text-2xl font-black text-red-700 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
          <p className="text-indigo-500 text-[10px] font-bold">TODAY</p>
          <p className="text-xl font-black text-indigo-700">{stats.today}</p>
        </div>
        <div className="bg-[var(--color-surface-subtle)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-[10px] font-bold">B&W</p>
          <p className="text-xl font-black text-[var(--color-on-surface)]">{stats.bw}</p>
        </div>
        <div className="bg-[var(--color-surface-subtle)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-[10px] font-bold">COLOR</p>
          <p className="text-xl font-black text-[var(--color-on-surface)]">{stats.color}</p>
        </div>
        <div className="bg-[var(--color-surface-subtle)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-[10px] font-bold">A4/A3</p>
          <p className="text-xl font-black text-[var(--color-on-surface)]">{stats.a4}/{stats.a3}</p>
        </div>
        <div className="bg-[var(--color-surface-subtle)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-[10px] font-bold">AVG ORDER</p>
          <p className="text-xl font-black text-[var(--color-on-surface)]">₹{stats.avgOrderValue}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)] material-symbols-outlined">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order ID..."
            className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="ready_for_pickup">Ready for Pickup</option>
          <option value="on_the_way">On the Way</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-outline)] bg-[var(--color-surface-container-lowest)] rounded-xl">
          <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">print</span>
          <p className="mt-4 font-bold">No print orders yet</p>
        </div>
      ) : (
        <>
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Priority</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Order ID</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Items</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Print Settings</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Total</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Status</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Date</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const item = order.order_items?.[0];
                let settings: Record<string, any> = {};
    try { if (item?.special_notes) settings = JSON.parse(item.special_notes); } catch { /* corrupted data, ignore */ }
                return (
                  <tr key={order.id} className={`border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)] ${order.priority > 0 ? "bg-amber-50/50" : ""}`}>
                    <td className="p-4">
                      <button onClick={async () => {
                        const newPriority = order.priority > 0 ? 0 : 1;
                        await supabase.from("orders").update({ priority: newPriority }).eq("id", order.id);
                        loadOrders();
                      }} className={`w-10 h-10 rounded-full flex items-center justify-center ${order.priority > 0 ? "bg-amber-200 text-amber-700" : "bg-[var(--color-surface-container)] text-[var(--color-outline-variant)] hover:bg-amber-100"}`}>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </button>
                    </td>
                    <td className="p-4 font-bold text-[var(--color-on-surface)] text-sm">{order.id.slice(0, 8)}...</td>
                    <td className="p-4 text-[var(--color-on-surface-variant)] text-sm">
                      {item?.name || "-"}
                    </td>
                    <td className="p-4 text-[var(--color-on-surface-variant)] text-sm">
                      <div className="flex flex-wrap gap-1">
                        {settings.pages && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{settings.pages}pg</span>}
                        {settings.copies && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{settings.copies}cp</span>}
                        {settings.colorMode && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{settings.colorMode === "bw" ? "B&W" : "Color"}</span>}
                        {settings.paperSize && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold uppercase">{settings.paperSize}</span>}
                      </div>
                      {settings.fileNames && settings.fileUrls && (
                        <div className="mt-1 space-y-0.5">
                          {settings.fileNames.map((name: string, fi: number) => {
                            const printed = settings.fileStatuses?.[fi];
                            return (
                              <div key={fi} className="flex items-center gap-1">
                                <button onClick={() => toggleFilePrinted(order.id, fi, settings)} className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${printed ? "bg-green-500 border-green-500" : "border-[var(--color-outline-variant)]"}`}>
                                  {printed && <span className="material-symbols-outlined text-white text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                                </button>
                                <span className={`text-xs truncate block max-w-[180px] ${printed ? "text-green-600 line-through" : "text-[var(--color-on-surface-variant)]"}`}>
                                  {name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-[var(--color-on-surface)]">₹{order.total_amount}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[order.status] || "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--color-outline)] text-sm">{new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleSelectOrder(order)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] p-3">
            <p className="text-xs text-[var(--color-outline)]">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = page <= 3 ? i + 1 : page + i - 2;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 text-xs font-bold rounded-lg ${pageNum === page ? "bg-indigo-600 text-white" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
        </>
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
        const hasAnyFiles = selFileNames.length > 0;
        const hasAnyAddOns = selSettings.addOns && selSettings.addOns.length > 0;
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 pb-0">
                <div>
                  <h3 className="font-bold text-lg">Order Details</h3>
                  <p className="text-sm text-[var(--color-outline)]">#{selectedOrder.id.slice(0, 8)} · {new Date(selectedOrder.placed_at).toLocaleString("en-IN")}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-11 h-11 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-[var(--color-surface-subtle)] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase tracking-wider">Total</p>
                    <p className="text-lg font-black text-[var(--color-on-surface)]">₹{selectedOrder.total_amount}</p>
                  </div>
                  <div className="bg-[var(--color-surface-subtle)] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase tracking-wider">Payment</p>
                    <p className="text-sm font-bold text-[var(--color-on-surface)] uppercase">{selectedOrder.payment_method || "N/A"}</p>
                  </div>
                  <div className="bg-[var(--color-surface-subtle)] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase tracking-wider">Address</p>
                    <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{selectedOrder.delivery_address || "N/A"}</p>
                  </div>
                </div>

                {hasAnySettings && (
                  <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Print Settings</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selSettings.pages || fallbackPages) && <span className="px-2.5 py-1 bg-[var(--color-surface-container-lowest)] text-indigo-700 rounded-lg text-xs font-bold">{selSettings.pages || fallbackPages} pages</span>}
                      {selSettings.copies && <span className="px-2.5 py-1 bg-[var(--color-surface-container-lowest)] text-indigo-700 rounded-lg text-xs font-bold">{selSettings.copies} copies</span>}
                      {selSettings.colorMode && <span className="px-2.5 py-1 bg-[var(--color-surface-container-lowest)] text-indigo-700 rounded-lg text-xs font-bold capitalize">{selSettings.colorMode === "bw" ? "B&W" : "Color"}</span>}
                      {selSettings.paperSize && <span className="px-2.5 py-1 bg-[var(--color-surface-container-lowest)] text-indigo-700 rounded-lg text-xs font-bold uppercase">{selSettings.paperSize}</span>}
                      {selSettings.orientation && <span className="px-2.5 py-1 bg-[var(--color-surface-container-lowest)] text-indigo-700 rounded-lg text-xs font-bold capitalize">{selSettings.orientation}</span>}
                      {selSettings.sides && <span className="px-2.5 py-1 bg-[var(--color-surface-container-lowest)] text-indigo-700 rounded-lg text-xs font-bold capitalize">{selSettings.sides} sided</span>}
                      {selSettings.paperType && <span className="px-2.5 py-1 bg-[var(--color-surface-container-lowest)] text-indigo-700 rounded-lg text-xs font-bold capitalize">{selSettings.paperType}</span>}
                      {fallbackEta && <span className="px-2.5 py-1 bg-[var(--color-surface-container-lowest)] text-indigo-700 rounded-lg text-xs font-bold">ETA {fallbackEta}m</span>}
                      {selSettings.rushTier && selSettings.rushTier !== "standard" && (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold">⚡ {selSettings.rushLabel || selSettings.rushTier}</span>
                      )}
                    </div>
                    {hasAnyAddOns && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selSettings.addOns.map((a: any, ai: number) => (
                          <span key={ai} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">{a.name || a.id}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!hasAnySettings && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">info</span>
                    <p className="text-xs text-amber-800">Detailed print settings unavailable for this order. Contact customer if needed.</p>
                  </div>
                )}

                {hasAnyFiles && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[var(--color-outline)] uppercase tracking-wider">Customer Files ({selFileNames.length})</h4>
                      <div className="flex items-center gap-2">
                        {signingUrls && <span className="text-[10px] text-indigo-500 font-bold animate-pulse">Generating access links...</span>}
                        {selFileStatuses.length > 0 && (
                          <span className="text-xs font-bold text-emerald-600">{selFileStatuses.filter(Boolean).length}/{selFileStatuses.length} printed</span>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-[var(--color-border-subtle)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                      {selFileNames.map((name: string, fi: number) => {
                        const printed = selFileStatuses[fi];
                        const originalUrl = selFileUrls[fi] || "";
                        const accessibleUrl = signedUrls[originalUrl] || originalUrl;
                        const isPdf = name.toLowerCase().endsWith(".pdf");
                        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(name);
                        return (
                          <div key={fi} className={`flex items-center gap-3 p-3 ${printed ? "bg-emerald-50/50" : "bg-white"}`}>
                            <button
                              onClick={() => toggleFilePrinted(selectedOrder.id, fi, selSettings)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${printed ? "bg-emerald-500 border-emerald-500" : "border-[var(--color-outline-variant)] hover:border-indigo-400"}`}
                            >
                              {printed && <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-bold truncate ${printed ? "text-emerald-700 line-through" : "text-[var(--color-on-surface)]"}`}>{name}</p>
                              <p className="text-[10px] text-[var(--color-outline-variant)]">{isPdf ? "PDF" : isImage ? "Image" : "File"}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {accessibleUrl && (
                                <button
                                  onClick={() => setPreviewFile({ name, url: accessibleUrl, type: isPdf ? "application/pdf" : isImage ? "image/jpeg" : "application/octet-stream" })}
                                  className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"
                                  title="Preview"
                                >
                                  <span className="material-symbols-outlined text-base">visibility</span>
                                </button>
                              )}
                              {accessibleUrl && (
                                <a
                                  href={accessibleUrl}
                                  download={name}
                                  className="w-10 h-10 rounded-lg bg-[var(--color-surface-subtle)] text-[var(--color-on-surface-variant)] flex items-center justify-center hover:bg-[var(--color-surface-container)] transition-colors"
                                  title="Download"
                                >
                                  <span className="material-symbols-outlined text-base">download</span>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!hasAnyFiles && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
                    <span className="material-symbols-outlined text-amber-500 text-2xl">folder_off</span>
                    <p className="text-sm font-bold text-amber-900">No files attached to this order</p>
                    <p className="text-xs text-amber-700 max-w-sm">
                      This order was placed before file attachments were tracked, or the files were not saved correctly.
                      Please contact the customer at {selectedOrder.delivery_address || "their registered address"} to get the documents.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-[var(--color-outline)] uppercase tracking-wider mb-2">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {["pending", "processing", "ready_for_pickup", "on_the_way", "delivered", "cancelled"].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          if (status === "cancelled" || status === "delivered") {
                            if (!confirm(`Are you sure you want to mark this order as ${status.replace(/_/g, " ")}?`)) return;
                          }
                          updateOrderStatus(selectedOrder.id, status as OrderStatus);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${
                          selectedOrder.status === status
                            ? "bg-indigo-600 text-white"
                            : "bg-[var(--color-surface-container)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]"
                        }`}
                      >
                        {status.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedOrder.status === "cancelled" && selectedOrder.payment_method !== "cod" && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Process refund of ₹${selectedOrder.total_amount}? This will update the order status to refunded.`)) return;
                      try {
                        await supabase.from("orders").update({ status: "refunded" }).eq("id", selectedOrder.id);
                        loadOrders();
                        setSelectedOrder(null);
                      } catch (e) {
                        console.error("[admin-printing] Refund failed:", e);
                        useToastStore.getState().addToast("Refund failed. Please try again.", "error");
                      }
                    }}
                    className="w-full py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100"
                  >
                    Process Refund (₹{selectedOrder.total_amount})
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)]">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="font-bold text-[var(--color-on-surface)] truncate">{previewFile.name}</h3>
                <p className="text-xs text-[var(--color-outline)]">{previewFile.type}</p>
              </div>
              <button onClick={() => setPreviewFile(null)} className="w-11 h-11 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center hover:bg-[var(--color-surface-container-high)]">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-[var(--color-surface-subtle)] p-4 flex items-center justify-center min-h-[400px]">
              {previewFile.type.startsWith("image/") ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md" />
              ) : previewFile.type === "application/pdf" || previewFile.name.toLowerCase().endsWith(".pdf") ? (
                <iframe src={previewFile.url} title={previewFile.name} className="w-full h-[75vh] bg-[var(--color-surface-container-lowest)] rounded-lg shadow-md border-0" />
              ) : (
                <div className="text-[var(--color-outline)]">Preview not available for this file type</div>
              )}
            </div>
            <div className="flex gap-2 p-4 border-t border-[var(--color-border-subtle)]">
              <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold text-center hover:bg-indigo-700">
                Open in new tab
              </a>
              <a href={previewFile.url} download={previewFile.name} className="flex-1 py-2 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] rounded-lg text-sm font-bold text-center hover:bg-[var(--color-surface-container-high)]">
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
