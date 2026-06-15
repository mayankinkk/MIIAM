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
          <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Promotions</h1>
          <p className="text-[var(--color-outline-variant)] text-sm">Manage discount codes and promotions</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-[#ba001c] text-white rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">add</span> Create Promotion
        </button>
      </div>

      {showCreate && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. SUMMER20" className="w-full p-3 border border-[var(--color-border-subtle)] rounded-lg text-sm font-bold uppercase" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Type</label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="w-full p-3 border border-[var(--color-border-subtle)] rounded-lg text-sm">
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Value</label>
              <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} className="w-full p-3 border border-[var(--color-border-subtle)] rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Min Order (₹)</label>
              <input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: parseFloat(e.target.value) || 0 })} className="w-full p-3 border border-[var(--color-border-subtle)] rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Max Discount (₹)</label>
              <input type="number" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} className="w-full p-3 border border-[var(--color-border-subtle)] rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Usage Limit</label>
              <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} className="w-full p-3 border border-[var(--color-border-subtle)] rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Expires</label>
              <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full p-3 border border-[var(--color-border-subtle)] rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createPromo} className="px-4 py-2 bg-[#ba001c] text-white rounded-lg text-sm font-bold">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] rounded-lg text-sm font-bold">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-[#ba001c]/20 border-t-[#ba001c] rounded-full animate-spin" /></div>
        ) : promos.length === 0 ? (
          <div className="py-12 text-center text-[var(--color-outline-variant)]">No promotions yet</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">Code</th>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">Discount</th>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">Min Order</th>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">Usage</th>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">Expires</th>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">Status</th>
                <th className="p-4 text-xs font-black text-[var(--color-outline-variant)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {promos.map((p) => (
                <tr key={p.id}>
                  <td className="p-4 font-bold text-[var(--color-on-surface)] uppercase">{p.code}</td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">{p.discount_type === "percentage" ? `${p.discount_value}%` : `₹${p.discount_value}`}{p.max_discount ? ` (max ₹${p.max_discount})` : ""}</td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">₹{p.min_order}</td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">{p.used_count}{p.usage_limit ? ` / ${p.usage_limit}` : ""}</td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">{p.expires_at ? new Date(p.expires_at).toLocaleDateString("en-IN") : "Never"}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${p.active ? "bg-green-100 text-green-700" : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"}`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 flex gap-1">
                    <button onClick={() => togglePromo(p.id, p.active)} className="px-3 py-2 bg-[var(--color-surface-container)] rounded text-xs font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]">
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
