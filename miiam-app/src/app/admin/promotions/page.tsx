"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmDialog";

const supabase = createClient();

interface Promotion {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount: number | null;
  min_order: number;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export default function PromotionsPage() {
  const { confirm } = useConfirm();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", discount_type: "percentage", discount_value: 10, max_discount: "", min_order: 0, usage_limit: "", expires_at: "" });

  useEffect(() => { loadPromos(); }, []);

  async function loadPromos() {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    if (data) setPromos(data);
    setLoading(false);
  }

  async function createPromo() {
    if (!form.code.trim()) return;
    const { error } = await supabase.from("promo_codes").insert({
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
      min_order: form.min_order,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      expires_at: form.expires_at || null,
      active: true,
      used_count: 0,
    });
    if (!error) {
      setShowCreate(false);
      setForm({ code: "", discount_type: "percentage", discount_value: 10, max_discount: "", min_order: 0, usage_limit: "", expires_at: "" });
      loadPromos();
    }
  }

  async function togglePromo(id: string, active: boolean) {
    await supabase.from("promo_codes").update({ active: !active }).eq("id", id);
    loadPromos();
  }

  async function deletePromo(id: string) {
    if (!await confirm({ title: "Delete", message: "Are you sure you want to delete this promotion?", variant: "danger" })) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    loadPromos();
  }

  return (
    <div className="px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Promotions</h1>
          <p className="text-slate-400 text-sm">Manage discount codes and promotions</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-[#ba001c] text-white rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">add</span> Create Promotion
        </button>
      </div>

      {showCreate && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. SUMMER20" className="w-full p-3 border border-slate-200 rounded-lg text-sm font-bold uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type</label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm">
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Value</label>
              <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} className="w-full p-3 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Min Order (₹)</label>
              <input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: parseFloat(e.target.value) || 0 })} className="w-full p-3 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Max Discount (₹)</label>
              <input type="number" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Usage Limit</label>
              <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Expires</label>
              <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createPromo} className="px-4 py-2 bg-[#ba001c] text-white rounded-lg text-sm font-bold">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-[#ba001c]/20 border-t-[#ba001c] rounded-full animate-spin" /></div>
        ) : promos.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No promotions yet</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Code</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Discount</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Min Order</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Usage</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Expires</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Status</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {promos.map((p) => (
                <tr key={p.id}>
                  <td className="p-4 font-bold text-slate-800 uppercase">{p.code}</td>
                  <td className="p-4 text-sm text-slate-600">{p.discount_type === "percentage" ? `${p.discount_value}%` : `₹${p.discount_value}`}{p.max_discount ? ` (max ₹${p.max_discount})` : ""}</td>
                  <td className="p-4 text-sm text-slate-600">₹{p.min_order}</td>
                  <td className="p-4 text-sm text-slate-600">{p.used_count}{p.usage_limit ? ` / ${p.usage_limit}` : ""}</td>
                  <td className="p-4 text-sm text-slate-600">{p.expires_at ? new Date(p.expires_at).toLocaleDateString("en-IN") : "Never"}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${p.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 flex gap-1">
                    <button onClick={() => togglePromo(p.id, p.active)} className="px-3 py-2 bg-slate-100 rounded text-xs font-bold text-slate-600 hover:bg-slate-200">
                      {p.active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => deletePromo(p.id)} className="px-3 py-2 bg-red-50 rounded text-xs font-bold text-red-600 hover:bg-red-100">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
