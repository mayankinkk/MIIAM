"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/store/toastStore";
import { getVendorIdForUser } from "@/lib/vendor";

interface PromoCode {
  id: string;
  code: string;
  discount_value: number;
  discount_type?: string;
  max_discount?: number;
  min_order_amount?: number;
  usage_limit?: number;
  used_count?: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

interface CustomerSegment {
  label: string;
  key: string;
  count: number;
  icon: string;
  description: string;
}

export default function VendorPromotions() {
  const supabase = useMemo(() => createClient(), []);
  const { confirm } = useConfirm();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: "",
    discount_value: 10,
    max_discount: 100,
    min_order_amount: 0,
    usage_limit: 100,
    valid_until: "",
  });
  const [segments, setSegments] = useState<CustomerSegment[]>([]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCreate) {
        setShowCreate(false);
      }
    };
    if (showCreate) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showCreate]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const id = await getVendorIdForUser();
    if (id) {
      setVendorId(id);
      await loadPromos(id);
      await loadSegments(id);
    }
    setLoading(false);
  }

  async function loadPromos(vId: string) {
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("vendor_id", vId)
      .order("created_at", { ascending: false });
    if (data) setPromoCodes(data);
  }

  async function loadSegments(vId: string) {
    const { data: orders } = await supabase
      .from("orders")
      .select("user_id, total_amount, placed_at")
      .eq("vendor_id", vId)
      .eq("status", "delivered");
    if (!orders || orders.length === 0) return;

    const userMap = new Map<string, { count: number; total: number; lastDate: Date }>();
    orders.forEach((o: { user_id: string; total_amount: number; placed_at: string }) => {
      const existing = userMap.get(o.user_id) || { count: 0, total: 0, lastDate: new Date(0) };
      existing.count++;
      existing.total += o.total_amount || 0;
      existing.lastDate = new Date(o.placed_at) > existing.lastDate ? new Date(o.placed_at) : existing.lastDate;
      userMap.set(o.user_id, existing);
    });

    const all = userMap.size;
    const returning = Array.from(userMap.values()).filter(u => u.count > 1).length;
    const avgSpend = Array.from(userMap.values()).reduce((s, u) => s + u.total, 0) / all;
    const highValue = Array.from(userMap.values()).filter(u => u.total > avgSpend * 1.5).length;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const lapsed = Array.from(userMap.values()).filter(u => u.lastDate < thirtyDaysAgo).length;

    setSegments([
      { label: "All Customers", key: "all", count: all, icon: "people", description: "Everyone who ordered from you" },
      { label: "Returning", key: "returning", count: returning, icon: "repeat", description: `Ordered more than once (${all > 0 ? Math.round(returning / all * 100) : 0}% of customers)` },
      { label: "High Spenders", key: "high_value", count: highValue, icon: "award_star", description: `Spent >₹${avgSpend.toFixed(0)} total (1.5x avg)` },
      { label: "Lapsed", key: "lapsed", count: lapsed, icon: "schedule", description: "No order in 30+ days" },
    ]);
  }

  const generateCode = () => {
    const prefix = "MIIAM";
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewPromo({ ...newPromo, code: `${prefix}${suffix}` });
  };

  const handleCreate = async () => {
    if (!newPromo.code || !newPromo.valid_until) {
      useToastStore.getState().addToast("Please fill in all required fields", "error");
      return;
    }
    if (!vendorId) return;

    const { error } = await supabase.from("promo_codes").insert({
      vendor_id: vendorId,
      code: newPromo.code.toUpperCase(),
      discount_value: newPromo.discount_value,
      discount_type: "percentage",
      max_discount: newPromo.max_discount,
      min_order_amount: newPromo.min_order_amount,
      usage_limit: newPromo.usage_limit,
      is_active: true,
      valid_from: new Date().toISOString(),
      valid_until: new Date(newPromo.valid_until).toISOString(),
    });

    if (error) {
      useToastStore.getState().addToast("Error creating promo: " + error.message, "error");
      return;
    }

    setShowCreate(false);
    setNewPromo({ code: "", discount_value: 10, max_discount: 100, min_order_amount: 0, usage_limit: 100, valid_until: "" });
    if (vendorId) loadPromos(vendorId);
  };

  const toggleActive = async (promo: PromoCode) => {
    await supabase.from("promo_codes").update({ is_active: !promo.is_active }).eq("id", promo.id);
    setPromoCodes(prev => prev.map((p) => (p.id === promo.id ? { ...p, is_active: !p.is_active } : p)));
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: "Delete Promotion", message: "Delete this promotion?", variant: "danger" })) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    setPromoCodes(prev => prev.filter((p) => p.id !== id));
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight">Promotions & Offers</h1>
          <p className="text-[var(--color-outline)] mt-1">Create discount codes to attract more customers</p>
        </div>
        <button
          onClick={() => { generateCode(); setShowCreate(true); }}
          className="bg-[var(--color-primary)] text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[var(--color-primary-dim)] transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Create Offer
        </button>
      </div>

      {/* Customer Segments */}
      {segments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[var(--color-outline)]">campaign</span>
            <h2 className="text-lg font-extrabold text-[var(--color-on-surface)]">Targeted Offers</h2>
            <span className="text-[10px] text-[var(--color-outline-variant)] bg-[var(--color-surface-container)] px-2 py-0.5 rounded-full">Send offers to segments</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {segments.map((seg) => (
              <div key={seg.key} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 border border-[var(--color-border-subtle)] hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-[var(--color-surface-container)] rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">{seg.icon}</span>
                  </div>
                  <span className="text-2xl font-black text-[var(--color-on-surface)]">{seg.count}</span>
                </div>
                <p className="font-bold text-[var(--color-on-surface)] text-sm">{seg.label}</p>
                <p className="text-[10px] text-[var(--color-outline)] mt-1">{seg.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Promos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-[var(--color-outline-variant)] animate-pulse">Loading promotions...</div>
        ) : promoCodes.length === 0 ? (
          <div className="col-span-full bg-[var(--color-surface-container-lowest)] border-2 border-dashed border-[var(--color-border-subtle)] rounded-3xl p-8 md:p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60 mb-4">local_offer</span>
            <p className="text-[var(--color-outline-variant)] font-medium text-lg">No promotions yet</p>
            <p className="text-[var(--color-outline-variant)]/60 text-sm mt-1">Create your first offer to attract more customers</p>
          </div>
        ) : (
          promoCodes.map((promo) => {
            const expired = isExpired(promo.valid_until);
            return (
              <div
                key={promo.id}
                className={`bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-sm border transition-all ${
                  expired ? "border-[var(--color-border-subtle)] opacity-60" : "border-[var(--color-border-subtle)] hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-2xl font-black tracking-wider text-[var(--color-primary)]">{promo.code}</p>
                    <p className="text-sm text-[var(--color-outline)] mt-1">
                      {promo.discount_value}% off{promo.max_discount ? ` • Up to ₹${promo.max_discount}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${promo.is_active && !expired ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`}></span>
                    <button
                      onClick={() => toggleActive(promo)}
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        promo.is_active && !expired
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"
                      }`}
                    >
                      {promo.is_active && !expired ? "Active" : expired ? "Expired" : "Paused"}
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <span className="material-symbols-outlined text-lg text-red-400">delete</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-outline)]">Min Order</span>
                    <span className="font-bold text-[var(--color-on-surface)]">₹{promo.min_order_amount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-outline)]">Usage</span>
                    <span className="font-bold text-[var(--color-on-surface)]">{promo.used_count || 0}/{promo.usage_limit || "∞"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-outline)]">Valid Until</span>
                    <span className={`font-bold ${expired ? "text-red-500" : "text-[var(--color-on-surface)]"}`}>
                      {new Date(promo.valid_until).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Usage Bar */}
                <div className="mt-4 h-1.5 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                    style={{ width: `${promo.usage_limit ? Math.min(((promo.used_count || 0) / promo.usage_limit) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Promo Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)} role="dialog" aria-modal="true" aria-labelledby="create-promo-title">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-md rounded-3xl p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 id="create-promo-title" className="text-xl font-extrabold text-[var(--color-on-surface)]">Create Promotion</h2>
              <button onClick={() => setShowCreate(false)} className="w-10 h-10 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="promo_code" className="text-sm font-semibold text-[var(--color-on-surface)]">Promo Code</label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="promo_code"
                    type="text"
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., MIIAM30"
                    className="flex-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)] uppercase font-bold tracking-wider"
                  />
                  <button onClick={generateCode} className="px-3 py-2 bg-[var(--color-surface-container)] rounded-xl text-xs font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]">
                    Generate
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discount_value" className="text-sm font-semibold text-[var(--color-on-surface)]">Discount %</label>
                  <input
                    id="discount_value"
                    type="number"
                    min="1"
                    max="100"
                    value={newPromo.discount_value}
                    onChange={(e) => setNewPromo({ ...newPromo, discount_value: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label htmlFor="max_discount" className="text-sm font-semibold text-[var(--color-on-surface)]">Max Discount (₹)</label>
                  <input
                    id="max_discount"
                    type="number"
                    min="0"
                    value={newPromo.max_discount}
                    onChange={(e) => setNewPromo({ ...newPromo, max_discount: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div>
                  <label htmlFor="min_order_amount_promo" className="text-sm font-semibold text-[var(--color-on-surface)]">Min Order Amount (₹)</label>
                  <input
                    id="min_order_amount_promo"
                    type="number"
                    min="0"
                    value={newPromo.min_order_amount}
                    onChange={(e) => setNewPromo({ ...newPromo, min_order_amount: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
              </div>
              <div>
                <label htmlFor="usage_limit" className="text-sm font-semibold text-[var(--color-on-surface)]">Usage Limit</label>
                <input
                  id="usage_limit"
                  type="number"
                  min="1"
                  value={newPromo.usage_limit}
                  onChange={(e) => setNewPromo({ ...newPromo, usage_limit: parseInt(e.target.value) || 1 })}
                  className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label htmlFor="valid_until" className="text-sm font-semibold text-[var(--color-on-surface)]">Valid Until</label>
                <input
                  id="valid_until"
                  type="date"
                  value={newPromo.valid_until}
                  onChange={(e) => setNewPromo({ ...newPromo, valid_until: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <button
                onClick={handleCreate}
                className="w-full py-4 bg-[var(--color-primary)] text-white font-extrabold rounded-2xl hover:bg-[var(--color-primary-dim)] transition-colors"
              >
                Create Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
