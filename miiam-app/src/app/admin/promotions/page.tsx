"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeGradientClass } from "@/lib/gradient-utils";

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
  { value: "from-accent to-accent/70", label: "MIIAM Green" },
  { value: "from-deal to-deal/70", label: "Deal Orange" },
  { value: "from-amber-500 to-orange-500", label: "Amber → Orange" },
  { value: "from-teal-500 to-cyan-500", label: "Teal → Cyan" },
  { value: "from-rose-500 to-pink-500", label: "Rose → Pink" },
  { value: "from-slate-700 to-slate-900", label: "Dark Slate" },
];

const EMPTY_PROMO = {
  badge: "",
  title: "",
  subtitle: "",
  gradient: "from-accent to-accent/70",
  link_url: "",
};

export default function PromotionsManagement() {
  const supabase = useMemo(() => createClient(), []);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState(EMPTY_PROMO);

  async function loadPromos() {
    const { data } = await supabase.from("home_promotions").select("*").order("position");
    if (data)
      setPromos(
        data.map((p: Promotion) => ({ ...p, gradient: normalizeGradientClass(p.gradient) }))
      );
    setLoading(false);
  }

  useEffect(() => {
    loadPromos();
    const channel = supabase
      .channel("promos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "home_promotions" }, () =>
        loadPromos()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  function openAdd() {
    setForm(EMPTY_PROMO);
    setEditing(null);
    setShowAdd(true);
  }

  function openEdit(p: Promotion) {
    setForm({
      badge: p.badge,
      title: p.title,
      subtitle: p.subtitle,
      gradient: p.gradient,
      link_url: p.link_url || "",
    });
    setEditing(p);
    setShowAdd(true);
  }

  async function savePromo() {
    if (!form.title) return;
    if (editing) {
      await supabase
        .from("home_promotions")
        .update({
          badge: form.badge,
          title: form.title,
          subtitle: form.subtitle,
          gradient: form.gradient,
          link_url: form.link_url || null,
        })
        .eq("id", editing.id);
    } else {
      await supabase.from("home_promotions").insert([
        {
          badge: form.badge,
          title: form.title,
          subtitle: form.subtitle,
          gradient: form.gradient,
          link_url: form.link_url || null,
          is_active: true,
          position: promos.length + 1,
        },
      ]);
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
    setPromos(promos.filter((p) => p.id !== id));
  }

  async function movePromo(index: number, direction: -1 | 1) {
    const newPromos = [...promos];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newPromos.length) return;
    [newPromos[index], newPromos[targetIndex]] = [newPromos[targetIndex], newPromos[index]];
    setPromos(newPromos);
    for (let i = 0; i < newPromos.length; i++) {
      await supabase
        .from("home_promotions")
        .update({ position: i + 1 })
        .eq("id", newPromos[i].id);
    }
  }

  if (loading)
    return <div className="px-8 py-12 text-[var(--color-outline)]">Loading promotions...</div>;

  const activePromos = promos.filter((p) => p.is_active);
  const inactivePromos = promos.filter((p) => !p.is_active);

  return (
    <div className="space-y-8 px-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Home Promotions
          </h1>
          <p className="text-[var(--color-outline)]">Manage the offer carousel on the home page.</p>
        </div>
        <button
          onClick={openAdd}
          className="text-on-primary rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold shadow-lg shadow-red-900/10 transition-all hover:scale-105 active:scale-95"
        >
          + Add Promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Total
          </p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{promos.length}</p>
        </div>
        <div className="rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm dark:border-green-800/30 dark:bg-green-900/20">
          <p className="mb-1 text-xs font-black tracking-widest text-green-600 uppercase dark:text-green-400">
            Active
          </p>
          <p className="text-3xl font-black text-green-600 dark:text-green-400">
            {activePromos.length}
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Inactive
          </p>
          <p className="text-3xl font-black text-[var(--color-outline-variant)]">
            {inactivePromos.length}
          </p>
        </div>
      </div>

      {/* Preview */}
      {activePromos.length > 0 && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-black tracking-widest text-[var(--color-on-surface)] uppercase">
            Live Preview
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {activePromos.map((p) => (
              <div
                key={p.id}
                className={`h-36 w-72 flex-shrink-0 rounded-2xl bg-gradient-to-r ${p.gradient} relative overflow-hidden p-5 text-white`}
              >
                {p.badge && (
                  <span className="mb-2 inline-block rounded bg-white/20 px-2 py-0.5 text-[10px] font-black">
                    {p.badge}
                  </span>
                )}
                <h3 className="text-xl font-black">{p.title}</h3>
                <p className="mt-1 text-sm text-white/80">{p.subtitle}</p>
                <span className="material-symbols-outlined absolute right-4 bottom-4 text-4xl text-white/40">
                  arrow_forward
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Promotions */}
      <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="border-b border-[var(--color-border-subtle)] p-4">
          <h2 className="text-sm font-black tracking-widest text-[var(--color-on-surface)] uppercase">
            Active Promotions
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {activePromos.map((promo, index) => (
            <div
              key={promo.id}
              className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface-subtle)]"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => movePromo(index, -1)}
                  disabled={index === 0}
                  className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface)] disabled:opacity-30"
                  aria-label="Move up"
                >
                  <span className="material-symbols-outlined text-sm">arrow_upward</span>
                </button>
                <button
                  onClick={() => movePromo(index, 1)}
                  disabled={index === activePromos.length - 1}
                  className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface)] disabled:opacity-30"
                  aria-label="Move down"
                >
                  <span className="material-symbols-outlined text-sm">arrow_downward</span>
                </button>
              </div>
              <div
                className={`h-14 w-20 rounded-xl bg-gradient-to-r ${promo.gradient} flex-shrink-0`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {promo.badge && (
                    <span className="rounded bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-[9px] font-black text-[var(--color-primary)]">
                      {promo.badge}
                    </span>
                  )}
                  <p className="truncate font-bold text-[var(--color-on-surface)]">{promo.title}</p>
                </div>
                <p className="truncate text-xs text-[var(--color-outline-variant)]">
                  {promo.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(promo)}
                  className="rounded-full bg-[var(--color-surface-container-high)] px-3 py-1 text-xs font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
                >
                  Edit
                </button>
                <button
                  onClick={() => togglePromo(promo.id, promo.is_active)}
                  className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => deletePromo(promo.id)}
                  className="p-2 text-[var(--color-outline-variant)] hover:text-red-500"
                  aria-label={`Delete ${promo.title}`}
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
          {activePromos.length === 0 && (
            <div className="p-8 text-center text-[var(--color-outline-variant)]">
              No active promotions
            </div>
          )}
        </div>
      </div>

      {/* Inactive Promotions */}
      {inactivePromos.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
          <div className="border-b border-[var(--color-border-subtle)] p-4">
            <h2 className="text-sm font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
              Inactive Promotions
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {inactivePromos.map((promo) => (
              <div key={promo.id} className="flex items-center gap-4 p-4 opacity-60">
                <div
                  className={`h-14 w-20 rounded-xl bg-gradient-to-r ${promo.gradient} flex-shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[var(--color-on-surface)]">{promo.title}</p>
                  <p className="truncate text-xs text-[var(--color-outline-variant)]">
                    {promo.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(promo)}
                    className="rounded-full bg-[var(--color-surface-container-high)] px-3 py-1 text-xs font-bold text-[var(--color-on-surface-variant)]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => togglePromo(promo.id, promo.is_active)}
                    className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-600"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => deletePromo(promo.id)}
                    className="p-2 text-[var(--color-outline-variant)] hover:text-red-500"
                    aria-label={`Delete ${promo.title}`}
                  >
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => e.key === "Escape" && setShowAdd(false)}
        >
          <div className="w-full max-w-md rounded-3xl bg-[var(--color-surface-container-lowest)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] p-6">
              <h2 className="text-xl font-black text-[var(--color-on-surface)]">
                {editing ? "Edit Promotion" : "Add Promotion"}
              </h2>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setEditing(null);
                }}
                className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 p-6">
              {/* Live preview */}
              <div
                className={`rounded-2xl bg-gradient-to-r ${form.gradient} relative h-36 overflow-hidden p-5 text-white`}
              >
                {form.badge && (
                  <span className="mb-2 inline-block rounded bg-white/20 px-2 py-0.5 text-[10px] font-black">
                    {form.badge}
                  </span>
                )}
                <h3 className="text-xl font-black">{form.title || "Promotion Title"}</h3>
                <p className="mt-1 text-sm text-white/80">{form.subtitle || "Subtitle text"}</p>
                <span className="material-symbols-outlined absolute right-4 bottom-4 text-4xl text-white/40">
                  arrow_forward
                </span>
              </div>

              <div>
                <label
                  htmlFor="promo-badge"
                  className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase"
                >
                  Badge Label
                </label>
                <input
                  id="promo-badge"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                  placeholder="e.g. NEW USER, FLAT OFF"
                />
              </div>
              <div>
                <label
                  htmlFor="promo-title"
                  className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase"
                >
                  Title *
                </label>
                <input
                  id="promo-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                  placeholder="e.g. Flat ₹100 OFF"
                />
              </div>
              <div>
                <label
                  htmlFor="promo-subtitle"
                  className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase"
                >
                  Subtitle
                </label>
                <input
                  id="promo-subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                  placeholder="e.g. On orders above ₹300"
                />
              </div>
              <div>
                <label
                  htmlFor="promo-gradient"
                  className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase"
                >
                  Color Theme
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {GRADIENT_OPTIONS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setForm({ ...form, gradient: g.value })}
                      className={`h-10 rounded-xl bg-gradient-to-r ${g.value} border-2 transition-all ${form.gradient === g.value ? "scale-110 border-white shadow-lg" : "border-transparent"}`}
                      title={g.label}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="promo-link"
                  className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase"
                >
                  Link URL (optional)
                </label>
                <input
                  id="promo-link"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                  placeholder="/app/food"
                />
              </div>
              <button
                onClick={savePromo}
                disabled={!form.title}
                className="text-on-primary w-full rounded-xl bg-[var(--color-primary)] py-3 font-bold transition-colors hover:bg-[#a00018] disabled:opacity-50"
              >
                {editing ? "Save Changes" : "Add Promotion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
