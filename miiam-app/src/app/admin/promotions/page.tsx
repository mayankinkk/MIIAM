"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Promotion {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  gradient: string;
  link_url: string | null;
  is_active: boolean;
  position: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const GRADIENT_OPTIONS = [
  { value: "from-orange-500 to-red-500", label: "Orange → Red" },
  { value: "from-green-500 to-emerald-500", label: "Green → Emerald" },
  { value: "from-blue-500 to-indigo-500", label: "Blue → Indigo" },
  { value: "from-purple-500 to-pink-500", label: "Purple → Pink" },
  { value: "from-amber-500 to-orange-500", label: "Amber → Orange" },
  { value: "from-teal-500 to-cyan-500", label: "Teal → Cyan" },
  { value: "from-rose-500 to-pink-500", label: "Rose → Pink" },
  { value: "from-slate-700 to-slate-900", label: "Dark Slate" },
];

const EMPTY_PROMO = { badge: "", title: "", subtitle: "", gradient: "from-blue-500 to-indigo-500", link_url: "" };

export default function PromotionsManagement() {
  const supabase = useMemo(() => createClient(), []);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState(EMPTY_PROMO);

  async function loadPromos() {
    const { data } = await supabase.from("home_promotions").select("*").order("position");
    if (data) setPromos(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPromos();
    const channel = supabase
      .channel("promos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "home_promotions" }, () => loadPromos())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  function openAdd() {
    setForm(EMPTY_PROMO);
    setEditing(null);
    setShowAdd(true);
  }

  function openEdit(p: Promotion) {
    setForm({ badge: p.badge, title: p.title, subtitle: p.subtitle, gradient: p.gradient, link_url: p.link_url || "" });
    setEditing(p);
    setShowAdd(true);
  }

  async function savePromo() {
    if (!form.title) return;
    if (editing) {
      await supabase.from("home_promotions").update({
        badge: form.badge, title: form.title, subtitle: form.subtitle,
        gradient: form.gradient, link_url: form.link_url || null,
      }).eq("id", editing.id);
    } else {
      await supabase.from("home_promotions").insert([{
        badge: form.badge, title: form.title, subtitle: form.subtitle,
        gradient: form.gradient, link_url: form.link_url || null,
        is_active: true, position: promos.length + 1,
      }]);
    }
    setShowAdd(false);
    setEditing(null);
    setForm(EMPTY_PROMO);
    loadPromos();
  }

  async function togglePromo(id: string, isActive: boolean) {
    await supabase.from("home_promotions").update({ is_active: !isActive }).eq("id", id);
    loadPromos();
  }

  async function deletePromo(id: string) {
    await supabase.from("home_promotions").delete().eq("id", id);
    setPromos(promos.filter(p => p.id !== id));
  }

  async function movePromo(index: number, direction: -1 | 1) {
    const newPromos = [...promos];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newPromos.length) return;
    [newPromos[index], newPromos[targetIndex]] = [newPromos[targetIndex], newPromos[index]];
    setPromos(newPromos);
    for (let i = 0; i < newPromos.length; i++) {
      await supabase.from("home_promotions").update({ position: i + 1 }).eq("id", newPromos[i].id);
    }
  }

  if (loading) return <div className="px-8 py-12 text-[var(--color-outline)]">Loading promotions...</div>;

  const activePromos = promos.filter(p => p.is_active);
  const inactivePromos = promos.filter(p => !p.is_active);

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-2">Home Promotions</h1>
          <p className="text-[var(--color-outline)]">Manage the offer carousel on the home page.</p>
        </div>
        <button onClick={openAdd} className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/10 hover:scale-105 active:scale-95 transition-all">
          + Add Promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Total</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{promos.length}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-3xl border border-green-100 dark:border-green-800/30 shadow-sm">
          <p className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Active</p>
          <p className="text-3xl font-black text-green-600 dark:text-green-400">{activePromos.length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-xs font-black text-[var(--color-outline-variant)] uppercase tracking-widest mb-1">Inactive</p>
          <p className="text-3xl font-black text-[var(--color-outline-variant)]">{inactivePromos.length}</p>
        </div>
      </div>

      {/* Preview */}
      {activePromos.length > 0 && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <h2 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm mb-4">Live Preview</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {activePromos.map((p) => (
              <div key={p.id} className={`flex-shrink-0 w-72 h-36 rounded-2xl bg-gradient-to-r ${p.gradient} p-5 text-white relative overflow-hidden`}>
                {p.badge && <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded mb-2 inline-block">{p.badge}</span>}
                <h3 className="text-xl font-black">{p.title}</h3>
                <p className="text-sm text-white/80 mt-1">{p.subtitle}</p>
                <span className="material-symbols-outlined absolute bottom-4 right-4 text-white/40 text-4xl">arrow_forward</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Promotions */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--color-border-subtle)]">
          <h2 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm">Active Promotions</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {activePromos.map((promo, index) => (
            <div key={promo.id} className="p-4 flex items-center gap-4 hover:bg-[var(--color-surface-subtle)]">
              <div className="flex flex-col gap-1">
                <button onClick={() => movePromo(index, -1)} disabled={index === 0} className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface)] disabled:opacity-30" aria-label="Move up">
                  <span className="material-symbols-outlined text-sm">arrow_upward</span>
                </button>
                <button onClick={() => movePromo(index, 1)} disabled={index === activePromos.length - 1} className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface)] disabled:opacity-30" aria-label="Move down">
                  <span className="material-symbols-outlined text-sm">arrow_downward</span>
                </button>
              </div>
              <div className={`w-20 h-14 rounded-xl bg-gradient-to-r ${promo.gradient} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {promo.badge && <span className="text-[9px] font-black bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-1.5 py-0.5 rounded">{promo.badge}</span>}
                  <p className="font-bold text-[var(--color-on-surface)] truncate">{promo.title}</p>
                </div>
                <p className="text-xs text-[var(--color-outline-variant)] truncate">{promo.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(promo)} className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]">
                  Edit
                </button>
                <button onClick={() => togglePromo(promo.id, promo.is_active)} className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-600">
                  Deactivate
                </button>
                <button onClick={() => deletePromo(promo.id)} className="text-[var(--color-outline-variant)] hover:text-red-500 p-2" aria-label={`Delete ${promo.title}`}>
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
          {activePromos.length === 0 && <div className="p-8 text-center text-[var(--color-outline-variant)]">No active promotions</div>}
        </div>
      </div>

      {/* Inactive Promotions */}
      {inactivePromos.length > 0 && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--color-border-subtle)]">
            <h2 className="font-black text-[var(--color-outline-variant)] uppercase tracking-widest text-sm">Inactive Promotions</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {inactivePromos.map((promo) => (
              <div key={promo.id} className="p-4 flex items-center gap-4 opacity-60">
                <div className={`w-20 h-14 rounded-xl bg-gradient-to-r ${promo.gradient} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--color-on-surface)] truncate">{promo.title}</p>
                  <p className="text-xs text-[var(--color-outline-variant)] truncate">{promo.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(promo)} className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">Edit</button>
                  <button onClick={() => togglePromo(promo.id, promo.is_active)} className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-600">Activate</button>
                  <button onClick={() => deletePromo(promo.id)} className="text-[var(--color-outline-variant)] hover:text-red-500 p-2" aria-label={`Delete ${promo.title}`}>
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" onKeyDown={(e) => e.key === "Escape" && setShowAdd(false)}>
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl max-w-md w-full">
            <div className="p-6 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
              <h2 className="text-xl font-black text-[var(--color-on-surface)]">{editing ? "Edit Promotion" : "Add Promotion"}</h2>
              <button onClick={() => { setShowAdd(false); setEditing(null); }} className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Live preview */}
              <div className={`rounded-2xl bg-gradient-to-r ${form.gradient} p-5 text-white h-36 relative overflow-hidden`}>
                {form.badge && <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded mb-2 inline-block">{form.badge}</span>}
                <h3 className="text-xl font-black">{form.title || "Promotion Title"}</h3>
                <p className="text-sm text-white/80 mt-1">{form.subtitle || "Subtitle text"}</p>
                <span className="material-symbols-outlined absolute bottom-4 right-4 text-white/40 text-4xl">arrow_forward</span>
              </div>

              <div>
                <label htmlFor="promo-badge" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Badge Label</label>
                <input id="promo-badge" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10" placeholder="e.g. NEW USER, FLAT OFF" />
              </div>
              <div>
                <label htmlFor="promo-title" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Title *</label>
                <input id="promo-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10" placeholder="e.g. Flat ₹100 OFF" />
              </div>
              <div>
                <label htmlFor="promo-subtitle" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Subtitle</label>
                <input id="promo-subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10" placeholder="e.g. On orders above ₹300" />
              </div>
              <div>
                <label htmlFor="promo-gradient" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Color Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {GRADIENT_OPTIONS.map((g) => (
                    <button key={g.value} onClick={() => setForm({ ...form, gradient: g.value })} className={`h-10 rounded-xl bg-gradient-to-r ${g.value} border-2 transition-all ${form.gradient === g.value ? "border-white scale-110 shadow-lg" : "border-transparent"}`} title={g.label} />
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="promo-link" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-1">Link URL (optional)</label>
                <input id="promo-link" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className="w-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10" placeholder="/app/food" />
              </div>
              <button onClick={savePromo} disabled={!form.title} className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:bg-[#a00018] disabled:opacity-50 transition-colors">
                {editing ? "Save Changes" : "Add Promotion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
