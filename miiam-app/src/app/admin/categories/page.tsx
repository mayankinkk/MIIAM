"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";

const DEFAULT_CATEGORIES = [
  "Main Course",
  "Appetizer",
  "Dessert",
  "Beverage",
  "Starter",
  "Bread",
  "Rice",
  "Noodle",
  "Snack",
  "Bakery",
  "Combo",
];

export default function AdminCategoriesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [supabase]);

  async function loadCategories() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "menu_categories")
        .maybeSingle();
      if (data?.value) {
        const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          setLoading(false);
          return;
        }
      }
      // Fallback to defaults
      setCategories(DEFAULT_CATEGORIES);
      await supabase
        .from("site_settings")
        .upsert(
          { key: "menu_categories", value: JSON.stringify(DEFAULT_CATEGORIES) },
          { onConflict: "key" }
        );
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    }
    setLoading(false);
  }

  const saveCategories = async (updated: string[]) => {
    setCategories(updated);
    setSaving(true);
    try {
      await supabase
        .from("site_settings")
        .upsert({ key: "menu_categories", value: JSON.stringify(updated) }, { onConflict: "key" });
      useToastStore.getState().addToast("Categories saved to database", "success");
    } catch (error: unknown) {
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
    }
    setSaving(false);
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) {
      useToastStore.getState().addToast("Category already exists", "error");
      return;
    }
    saveCategories([...categories, newCategory.trim()]);
    setNewCategory("");
  };

  const deleteCategory = (index: number) => {
    if (confirm(`Delete "${categories[index]}"?`)) {
      const updated = categories.filter((_, i) => i !== index);
      saveCategories(updated);
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(categories[index]);
  };

  const saveEdit = () => {
    if (editingIndex === null || !editValue.trim()) return;
    const updated = [...categories];
    updated[editingIndex] = editValue.trim();
    saveCategories(updated);
    setEditingIndex(null);
    setEditValue("");
  };

  const moveCategory = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const updated = [...categories];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    saveCategories(updated);
  };

  if (loading)
    return (
      <div className="text-on-surface-variant px-8 py-12 text-center">Loading categories...</div>
    );

  return (
    <div className="space-y-8 px-8">
      <div>
        <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Menu Categories</h1>
        <p className="mt-1 text-sm text-[var(--color-outline)]">
          Manage menu item categories used across the app. Changes sync to all users via database.
        </p>
        {saving && <p className="text-primary mt-1 text-xs">Saving...</p>}
      </div>

      {/* Add new category */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          placeholder="New category name"
          className="flex-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:outline-none"
        />
        <button
          onClick={addCategory}
          className="text-on-primary rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold hover:opacity-90"
        >
          Add
        </button>
      </div>

      {/* Category list */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)]">
        {categories.map((category, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-[var(--color-border-subtle)] px-6 py-4 last:border-b-0 hover:bg-[var(--color-surface-subtle)]"
          >
            <span className="w-8 text-sm text-[var(--color-on-surface-variant)]">{index + 1}</span>

            {editingIndex === index ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                onBlur={saveEdit}
                autoFocus
                className="flex-1 rounded-lg border border-[var(--color-primary)] bg-white px-3 py-2 focus:outline-none"
              />
            ) : (
              <span className="flex-1 font-bold text-[var(--color-on-surface)]">{category}</span>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => moveCategory(index, "up")}
                disabled={index === 0}
                className="rounded-lg p-2 hover:bg-[var(--color-surface-container-high)] disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">arrow_upward</span>
              </button>
              <button
                onClick={() => moveCategory(index, "down")}
                disabled={index === categories.length - 1}
                className="rounded-lg p-2 hover:bg-[var(--color-surface-container-high)] disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </button>
              <button
                onClick={() => startEdit(index)}
                className="rounded-lg p-2 hover:bg-[var(--color-surface-container-high)]"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
              <button
                onClick={() => deleteCategory(index)}
                className="rounded-lg p-2 text-red-600 hover:bg-red-100"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
