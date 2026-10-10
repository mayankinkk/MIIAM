"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";

interface Cuisine {
  id: string;
  name: string;
  image_url?: string;
  item_count?: number;
  vendor_count?: number;
  active: boolean;
}

const defaultCuisines: Cuisine[] = [];

export default function AdminCuisinesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [cuisines, setCuisines] = useState<Cuisine[]>(defaultCuisines);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCuisine, setEditingCuisine] = useState<Cuisine | null>(null);
  const [newCuisine, setNewCuisine] = useState({ name: "", image_url: "" });

  useEffect(() => {
    loadCuisines();
  }, [supabase]);

  async function loadCuisines() {
    setLoading(true);
    const { data } = await supabase.from("cuisines").select("*").order("name");
    if (data && data.length > 0) setCuisines(data);
    setLoading(false);
  }

  const handleAddCuisine = async () => {
    if (!newCuisine.name) {
      useToastStore.getState().addToast("Please enter cuisine name", "error");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("cuisines").insert({
        name: newCuisine.name,
        image_url: newCuisine.image_url || null,
        active: true,
      });
      if (error) throw error;
      useToastStore.getState().addToast("Cuisine added!", "success");
      setShowAddModal(false);
      setNewCuisine({ name: "", image_url: "" });
      loadCuisines();
    } catch (error: unknown) {
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCuisine = async () => {
    if (!editingCuisine) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("cuisines")
        .update({ name: editingCuisine.name, active: editingCuisine.active })
        .eq("id", editingCuisine.id);
      if (error) throw error;
      useToastStore.getState().addToast("Cuisine updated!", "success");
      setEditingCuisine(null);
      loadCuisines();
    } catch (error: unknown) {
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCuisine = async (id: string) => {
    if (!confirm("Delete this cuisine?")) return;
    setLoading(true);
    try {
      await supabase.from("cuisines").delete().eq("id", id);
      setCuisines(cuisines.filter((c) => c.id !== id));
      useToastStore.getState().addToast("Cuisine deleted!", "success");
    } catch (error: unknown) {
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (cuisine: Cuisine) => {
    const newActive = !cuisine.active;
    setCuisines(cuisines.map((c) => (c.id === cuisine.id ? { ...c, active: newActive } : c)));
    try {
      await supabase.from("cuisines").update({ active: newActive }).eq("id", cuisine.id);
    } catch (err: unknown) {
      useToastStore.getState().addToast(`Failed: ${(err as Error).message}`, "error");
      setCuisines(cuisines.map((c) => (c.id === cuisine.id ? { ...c, active: !newActive } : c)));
    }
  };

  const filteredCuisines = cuisines.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="px-8">Loading cuisines...</div>;

  return (
    <div className="space-y-8 px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Cuisines</h1>
          <p className="mt-1 text-sm text-[var(--color-outline)]">
            Manage food categories and cuisines
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-on-primary rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold"
        >
          + Add Cuisine
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5">
          <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase">
            Total Cuisines
          </p>
          <p className="text-2xl font-black text-[var(--color-on-surface)]">{cuisines.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5">
          <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase">
            Active
          </p>
          <p className="text-2xl font-black text-green-600">
            {cuisines.filter((c) => c.active).length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5">
          <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase">
            Total Items
          </p>
          <p className="text-2xl font-black text-[var(--color-on-surface)]">
            {cuisines.reduce((acc, c) => acc + (c.item_count || 0), 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5">
          <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase">
            Vendors
          </p>
          <p className="text-2xl font-black text-[var(--color-on-surface)]">
            {cuisines.reduce((acc, c) => acc + (c.vendor_count || 0), 0)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="border-b p-4">
          <div className="relative max-w-md">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cuisines..."
              className="w-full rounded-xl border border-[var(--color-border-subtle)] py-2 pr-4 pl-10 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCuisines.map((cuisine) => (
            <div
              key={cuisine.id}
              className={`rounded-2xl border p-4 transition-all ${
                cuisine.active
                  ? "border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)]"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] opacity-60"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100">
                  <span className="text-xl">🍽️</span>
                </div>
                <button
                  onClick={() => toggleActive(cuisine)}
                  className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                    cuisine.active
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {cuisine.active ? "Active" : "Inactive"}
                </button>
              </div>
              <h3 className="text-lg font-black text-[var(--color-on-surface)]">{cuisine.name}</h3>
              <div className="mt-2 flex gap-4 text-xs text-[var(--color-outline)]">
                <span>{cuisine.item_count || 0} items</span>
                <span>•</span>
                <span>{cuisine.vendor_count || 0} vendors</span>
              </div>
              <div className="mt-4 flex gap-2 border-t border-[var(--color-border-subtle)] pt-3">
                <button
                  onClick={() => setEditingCuisine(cuisine)}
                  className="hover:text-on-primary flex-1 rounded-lg border border-[var(--color-primary)] py-2 text-sm font-bold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCuisine(cuisine.id)}
                  className="rounded-lg px-4 py-2 text-red-500 transition-all hover:bg-red-50"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-container-lowest)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Add New Cuisine</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[var(--color-outline-variant)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                  Cuisine Name *
                </label>
                <input
                  type="text"
                  value={newCuisine.name}
                  onChange={(e) => setNewCuisine({ ...newCuisine, name: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm"
                  placeholder="e.g., Mexican, Thai"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                  Image URL (optional)
                </label>
                <input
                  type="text"
                  value={newCuisine.image_url}
                  onChange={(e) => setNewCuisine({ ...newCuisine, image_url: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm"
                  placeholder="https://..."
                />
              </div>
              <button
                onClick={handleAddCuisine}
                disabled={loading}
                className="text-on-primary w-full rounded-xl bg-[var(--color-primary)] py-3 font-bold disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Cuisine"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCuisine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-container-lowest)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Edit Cuisine</h2>
              <button
                onClick={() => setEditingCuisine(null)}
                className="text-[var(--color-outline-variant)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                  Cuisine Name
                </label>
                <input
                  type="text"
                  value={editingCuisine.name}
                  onChange={(e) => setEditingCuisine({ ...editingCuisine, name: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingCuisine.active}
                  onChange={(e) =>
                    setEditingCuisine({ ...editingCuisine, active: e.target.checked })
                  }
                  className="h-5 w-5"
                />
                <label htmlFor="active" className="text-sm font-bold">
                  Active (visible to users)
                </label>
              </div>
              <button
                onClick={handleUpdateCuisine}
                disabled={loading}
                className="text-on-primary w-full rounded-xl bg-[var(--color-primary)] py-3 font-bold disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Cuisine"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
