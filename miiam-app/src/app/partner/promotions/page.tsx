"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

export default function VendorPromotions() {
  const supabase = createClient();
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

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const id = await getVendorIdForUser();
    if (id) {
      setVendorId(id);
      await loadPromos(id);
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

  const generateCode = () => {
    const prefix = "MIIAM";
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewPromo({ ...newPromo, code: `${prefix}${suffix}` });
  };

  const handleCreate = async () => {
    if (!newPromo.code || !newPromo.valid_until) {
      alert("Please fill in all required fields");
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
      alert("Error creating promo: " + error.message);
      return;
    }

    setShowCreate(false);
    setNewPromo({ code: "", discount_value: 10, max_discount: 100, min_order_amount: 0, usage_limit: 100, valid_until: "" });
    if (vendorId) loadPromos(vendorId);
  };

  const toggleActive = async (promo: PromoCode) => {
    await supabase.from("promo_codes").update({ is_active: !promo.is_active }).eq("id", promo.id);
    setPromoCodes(promoCodes.map((p) => (p.id === promo.id ? { ...p, is_active: !p.is_active } : p)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    setPromoCodes(promoCodes.filter((p) => p.id !== id));
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Promotions & Offers</h1>
          <p className="text-slate-500 mt-1">Create discount codes to attract more customers</p>
        </div>
        <button
          onClick={() => { generateCode(); setShowCreate(true); }}
          className="bg-[#ba001c] text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#a40017] transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Create Offer
        </button>
      </div>

      {/* Active Promos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400 animate-pulse">Loading promotions...</div>
        ) : promoCodes.length === 0 ? (
          <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">local_offer</span>
            <p className="text-slate-400 font-medium text-lg">No promotions yet</p>
            <p className="text-slate-300 text-sm mt-1">Create your first offer to attract more customers</p>
          </div>
        ) : (
          promoCodes.map((promo) => {
            const expired = isExpired(promo.valid_until);
            return (
              <div
                key={promo.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                  expired ? "border-slate-200 opacity-60" : "border-slate-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-2xl font-black tracking-wider text-[#ba001c]">{promo.code}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {promo.discount_value}% off{promo.max_discount ? ` • Up to ₹${promo.max_discount}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${promo.is_active && !expired ? "bg-green-500" : "bg-slate-300"}`}></span>
                    <button
                      onClick={() => toggleActive(promo)}
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        promo.is_active && !expired
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {promo.is_active && !expired ? "Active" : expired ? "Expired" : "Paused"}
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-lg text-red-400">delete</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Min Order</span>
                    <span className="font-bold text-slate-700">₹{promo.min_order_amount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Usage</span>
                    <span className="font-bold text-slate-700">{promo.used_count || 0}/{promo.usage_limit || "∞"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valid Until</span>
                    <span className={`font-bold ${expired ? "text-red-500" : "text-slate-700"}`}>
                      {new Date(promo.valid_until).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Usage Bar */}
                <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ba001c] rounded-full transition-all"
                    style={{ width: `${promo.usage_limit ? Math.min((promo.used_count! / promo.usage_limit) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Promo Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">Create Promotion</h2>
              <button onClick={() => setShowCreate(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Promo Code</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., MIIAM30"
                    className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] uppercase font-bold tracking-wider"
                  />
                  <button onClick={generateCode} className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200">
                    Generate
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Discount %</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newPromo.discount_value}
                    onChange={(e) => setNewPromo({ ...newPromo, discount_value: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Max Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPromo.max_discount}
                    onChange={(e) => setNewPromo({ ...newPromo, max_discount: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                  />
                </div>
              </div>
              <div>
                  <label className="text-sm font-semibold text-slate-700">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPromo.min_order_amount}
                    onChange={(e) => setNewPromo({ ...newPromo, min_order_amount: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                  />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Usage Limit</label>
                <input
                  type="number"
                  min="1"
                  value={newPromo.usage_limit}
                  onChange={(e) => setNewPromo({ ...newPromo, usage_limit: parseInt(e.target.value) || 1 })}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Valid Until</label>
                <input
                  type="date"
                  value={newPromo.valid_until}
                  onChange={(e) => setNewPromo({ ...newPromo, valid_until: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                />
              </div>
              <button
                onClick={handleCreate}
                className="w-full py-4 bg-[#ba001c] text-white font-extrabold rounded-2xl hover:bg-[#a40017] transition-colors"
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
