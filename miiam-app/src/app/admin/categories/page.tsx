"use client";

import { useState, useEffect } from "react";

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
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("miiam_categories");
    if (saved) {
      setCategories(JSON.parse(saved));
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  const saveCategories = (updated: string[]) => {
    setCategories(updated);
    localStorage.setItem("miiam_categories", JSON.stringify(updated));
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) {
      alert("Category already exists");
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

  return (
    <div className="px-8 space-y-8">
      <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Categories</h1>
      <p className="text-sm text-[var(--color-on-surface-variant)]">Manage menu item categories used across the app.</p>

      {/* Add new category */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          placeholder="New category name"
          className="flex-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] text-[var(--color-on-surface)] px-4 py-3 rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
        />
        <button onClick={addCategory} className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90">
          Add
        </button>
      </div>

      {/* Category list */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden">
        {categories.map((category, index) => (
          <div key={index} className="flex items-center gap-4 px-6 py-4 border-b border-[var(--color-border-subtle)] last:border-b-0 hover:bg-[var(--color-surface-subtle)]">
            <span className="text-[var(--color-on-surface-variant)] text-sm w-8">{index + 1}</span>
            
            {editingIndex === index ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                onBlur={saveEdit}
                autoFocus
                className="flex-1 bg-white border border-[var(--color-primary)] px-3 py-2 rounded-lg focus:outline-none"
              />
            ) : (
              <span className="flex-1 text-[var(--color-on-surface)] font-bold">{category}</span>
            )}

            <div className="flex items-center gap-2">
              <button onClick={() => moveCategory(index, "up")} disabled={index === 0} className="p-2 hover:bg-[var(--color-surface-container-high)] rounded-lg disabled:opacity-30">
                <span className="material-symbols-outlined text-sm">arrow_upward</span>
              </button>
              <button onClick={() => moveCategory(index, "down")} disabled={index === categories.length - 1} className="p-2 hover:bg-[var(--color-surface-container-high)] rounded-lg disabled:opacity-30">
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </button>
              <button onClick={() => startEdit(index)} className="p-2 hover:bg-[var(--color-surface-container-high)] rounded-lg">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
              <button onClick={() => deleteCategory(index)} className="p-2 hover:bg-red-100 text-red-600 rounded-lg">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}