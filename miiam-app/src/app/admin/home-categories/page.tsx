"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeGradientClass } from "@/lib/gradient-utils";
import { useToastStore } from "@/lib/store/toastStore";

interface HomeCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const DEFAULT_CATEGORIES: HomeCategory[] = [
  {
    id: "food?filter=under_99",
    label: "Under ₹99",
    icon: "local_fire_department",
    color: "from-orange-400 to-red-400",
  },
  {
    id: "food?filter=under_149",
    label: "Under ₹149",
    icon: "savings",
    color: "from-emerald-400 to-teal-400",
  },
  {
    id: "food?filter=under_199",
    label: "Under ₹199",
    icon: "star",
    color: "from-accent to-accent/70",
  },
  {
    id: "food?filter=under_249",
    label: "Under ₹249",
    icon: "new_releases",
    color: "from-deal to-deal/70",
  },
  {
    id: "food?filter=combos",
    label: "Combos",
    icon: "merge",
    color: "from-amber-400 to-orange-400",
  },
  {
    id: "food?filter=bakery",
    label: "Bakery",
    icon: "bakery_dining",
    color: "from-pink-400 to-rose-400",
  },
];

const ICON_OPTIONS = [
  "local_fire_department",
  "savings",
  "star",
  "new_releases",
  "merge",
  "bakery_dining",
  "restaurant",
  "lunch_dining",
  "local_pizza",
  "ramen_dining",
  "icecream",
  "cake",
  "local_bar",
  "coffee",
  "eco",
  "apartment",
  "local_offer",
  "inventory_2",
];

const COLOR_OPTIONS = [
  { label: "Orange-Red", value: "from-orange-400 to-red-400" },
  { label: "Emerald-Teal", value: "from-emerald-400 to-teal-400" },
  { label: "MIIAM Green", value: "from-accent to-accent/70" },
  { label: "Deal Orange", value: "from-deal to-deal/70" },
  { label: "Amber-Orange", value: "from-amber-400 to-orange-400" },
  { label: "Pink-Rose", value: "from-pink-400 to-rose-400" },
  { label: "Green-Lime", value: "from-green-400 to-lime-400" },
  { label: "Cyan → Green", value: "from-cyan-400 to-accent/70" },
  { label: "Red-Pink", value: "from-red-400 to-pink-400" },
  { label: "Yellow → Green", value: "from-primary to-accent" },
];

export default function AdminHomeCategoriesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<HomeCategory | null>(null);
  const [newCat, setNewCat] = useState<HomeCategory>({
    id: "",
    label: "",
    icon: "restaurant",
    color: "from-orange-400 to-red-400",
  });

  useEffect(() => {
    loadCategories();
  }, [supabase]);

  async function loadCategories() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "home_categories")
        .maybeSingle();
      if (data?.value) {
        const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(
            parsed.map((c: HomeCategory) => ({ ...c, color: normalizeGradientClass(c.color) }))
          );
          setLoading(false);
          return;
        }
      }
      setCategories(DEFAULT_CATEGORIES);
      await supabase
        .from("site_settings")
        .upsert(
          { key: "home_categories", value: JSON.stringify(DEFAULT_CATEGORIES) },
          { onConflict: "key" }
        );
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    }
    setLoading(false);
  }

  const saveCategories = async (updated: HomeCategory[]) => {
    setCategories(updated);
    setSaving(true);
    try {
      await supabase
        .from("site_settings")
        .upsert({ key: "home_categories", value: JSON.stringify(updated) }, { onConflict: "key" });
      useToastStore.getState().addToast("Home categories saved", "success");
    } catch (error: unknown) {
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
    }
    setSaving(false);
  };

  const addCategory = () => {
    if (!newCat.label.trim()) {
      useToastStore.getState().addToast("Enter a label", "error");
      return;
    }
    const cat = { ...newCat, id: newCat.id || newCat.label.toLowerCase().replace(/\s+/g, "_") };
    saveCategories([...categories, cat]);
    setNewCat({ id: "", label: "", icon: "restaurant", color: "from-orange-400 to-red-400" });
    setShowAdd(false);
  };

  const deleteCategory = (index: number) => {
    if (confirm(`Delete "${categories[index].label}"?`)) {
      saveCategories(categories.filter((_, i) => i !== index));
    }
  };

  const moveCategory = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const updated = [...categories];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    saveCategories(updated);
  };

  const updateCategory = (index: number, field: keyof HomeCategory, value: string) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    saveCategories(updated);
  };

  if (loading)
    return (
      <div className="text-on-surface-variant px-8 py-12 text-center">
        Loading home categories...
      </div>
    );

  return (
    <div className="space-y-8 px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Home Categories</h1>
          <p className="mt-1 text-sm text-[var(--color-outline)]">
            Manage the category shortcuts shown on the home page. Changes sync instantly.
          </p>
          {saving && <p className="text-primary mt-1 text-xs">Saving...</p>}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="text-on-primary rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold"
        >
          + Add Category
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4"
          >
            <div className="flex items-center justify-between">
              <div
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}
              >
                <span className="material-symbols-outlined text-xl text-white">{cat.icon}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveCategory(index, "up")}
                  disabled={index === 0}
                  className="rounded-lg p-1.5 hover:bg-[var(--color-surface-container-high)] disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-sm">arrow_upward</span>
                </button>
                <button
                  onClick={() => moveCategory(index, "down")}
                  disabled={index === categories.length - 1}
                  className="rounded-lg p-1.5 hover:bg-[var(--color-surface-container-high)] disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-sm">arrow_downward</span>
                </button>
                <button
                  onClick={() => deleteCategory(index)}
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-100"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-outline)] uppercase">
                Label
              </label>
              <input
                type="text"
                value={cat.label}
                onChange={(e) => updateCategory(index, "label", e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-outline)] uppercase">
                Link (URL path)
              </label>
              <input
                type="text"
                value={cat.id}
                onChange={(e) => updateCategory(index, "id", e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-outline)] uppercase">
                Icon
              </label>
              <select
                value={cat.icon}
                onChange={(e) => updateCategory(index, "icon", e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--color-outline)] uppercase">
                Color
              </label>
              <select
                value={cat.color}
                onChange={(e) => updateCategory(index, "color", e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-container-lowest)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Add Home Category</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="text-[var(--color-outline-variant)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold">Label *</label>
                <input
                  type="text"
                  value={newCat.label}
                  onChange={(e) => setNewCat({ ...newCat, label: e.target.value })}
                  className="w-full rounded-xl border p-3 text-sm"
                  placeholder="e.g., Weekend Special"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">Link</label>
                <input
                  type="text"
                  value={newCat.id}
                  onChange={(e) => setNewCat({ ...newCat, id: e.target.value })}
                  className="w-full rounded-xl border p-3 font-mono text-sm"
                  placeholder="e.g., food?filter=special"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">Icon</label>
                <select
                  value={newCat.icon}
                  onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                  className="w-full rounded-xl border p-3 text-sm"
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">Color</label>
                <select
                  value={newCat.color}
                  onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                  className="w-full rounded-xl border p-3 text-sm"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={addCategory}
                className="text-on-primary w-full rounded-xl bg-[var(--color-primary)] py-3 font-bold"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
