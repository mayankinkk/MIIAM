"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PromoCode {
  id: string;
  code: string;
  discount_type?: string;
  discount_value?: number;
  min_order_amount?: number;
  uses_count?: number;
  is_active?: boolean;
  created_at?: string;
  [key: string]: any;
}

export default function Promotions() {
  const supabase = createClient();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 10,
    min_order_amount: 0,
  });

  useEffect(() => {
    loadPromos();
  }, [supabase]);

  async function loadPromos() {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    if (data) setPromos(data);
    setLoading(false);
  }

  async function addPromo() {
    if (!newPromo.code || !newPromo.discount_value) {
      alert("Please enter a promo code and discount value");
      return;
    }
    
    const promoData: any = {
      code: newPromo.code.toUpperCase(),
      discount_type: newPromo.discount_type,
      discount_value: newPromo.discount_value,
      min_order_amount: newPromo.min_order_amount,
      is_active: true,
      uses_count: 0,
    };
    
    const { data, error } = await supabase.from("promo_codes").insert([promoData]).select().single();
    
    if (error) {
      console.error("Error creating promo:", error);
      alert(`Error: ${error.message}`);
      return;
    }
    
    if (data) {
      setPromos([data, ...promos]);
      setShowAddPromo(false);
      setNewPromo({
        code: "",
        discount_type: "percentage",
        discount_value: 10,
        min_order_amount: 0,
      });
    }
  }

  async function togglePromoActive(id: string, isActive: boolean) {
    await supabase.from("promo_codes").update({ is_active: !isActive }).eq("id", id);
    loadPromos();
  }

  async function deletePromo(id: string) {
    await supabase.from("promo_codes").delete().eq("id", id);
    setPromos(promos.filter(p => p.id !== id));
  }

  const activePromos = promos.filter(p => p.is_active);
  const totalSavings = promos.reduce((s, p) => s + ((p.uses_count || 0) * (p.discount_value || 0)), 0);

  if (loading) return <div className="px-8">Loading promotions...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Promo Codes</h1>
          <p className="text-slate-500">Create and manage discount codes and offers.</p>
        </div>
        <button 
          onClick={() => setShowAddPromo(true)}
          className="bg-[#ba001c] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/10 hover:scale-105 active:scale-95 transition-all"
        >
          + Create Promo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Codes</p>
          <p className="text-3xl font-black text-slate-800">{promos.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm">
          <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Active</p>
          <p className="text-3xl font-black text-green-600">{activePromos.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Uses</p>
          <p className="text-3xl font-black text-slate-800">{promos.reduce((s, p) => s + (p.uses_count || 0), 0)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Savings Given</p>
          <p className="text-3xl font-black text-red-500">₹{totalSavings}</p>
        </div>
      </div>

      {/* Promo Codes Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Order</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Uses</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promos.map(promo => (
                <tr key={promo.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <span className="font-mono font-black text-[#ba001c] bg-[#ba001c]/10 px-3 py-1 rounded-lg">{promo.code}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-800">
                      {promo.discount_type === "percentage" ? `${promo.discount_value}%` : `₹${promo.discount_value}`}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">₹{promo.min_order_amount || 0}</td>
                  <td className="p-4">
                    <span className="text-sm font-bold text-slate-800">{promo.uses_count || 0}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    -
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => togglePromoActive(promo.id, !!promo.is_active)}
                      className={`text-xs font-bold px-3 py-1 rounded-full ${promo.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {promo.is_active ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => deletePromo(promo.id)}
                      className="text-slate-400 hover:text-red-500 ml-2"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Promo Modal */}
      {showAddPromo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">Create Promo Code</h2>
              <button onClick={() => setShowAddPromo(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Promo Code</label>
                <input
                  type="text"
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#ba001c]/10"
                  placeholder="e.g. SAVE20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Discount Type</label>
                  <select
                    value={newPromo.discount_type}
                    onChange={(e) => setNewPromo({ ...newPromo, discount_type: e.target.value as "percentage" | "fixed" })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/10"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Value</label>
                  <input
                    type="number"
                    value={newPromo.discount_value}
                    onChange={(e) => setNewPromo({ ...newPromo, discount_value: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Min Order Amount (₹)</label>
                <input
                  type="number"
                  value={newPromo.min_order_amount}
                  onChange={(e) => setNewPromo({ ...newPromo, min_order_amount: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/10"
                />
              </div>
              
              <button
                onClick={addPromo}
                className="w-full py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:bg-[#a00018]"
              >
                Create Promo Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}