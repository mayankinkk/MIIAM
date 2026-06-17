"use client";

import { useEffect, useState } from "react";
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
  const supabase = createClient();
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
    } catch (error: any) {
      useToastStore.getState().addToast(`Failed: ${error.message}`, "error");
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
    } catch (error: any) {
      useToastStore.getState().addToast(`Failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCuisine = async (id: string) => {
    if (!confirm("Delete this cuisine?")) return;
    setLoading(true);
    try {
      await supabase.from("cuisines").delete().eq("id", id);
      setCuisines(cuisines.filter(c => c.id !== id));
      useToastStore.getState().addToast("Cuisine deleted!", "success");
    } catch (error: any) {
      useToastStore.getState().addToast(`Failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (cuisine: Cuisine) => {
    const newActive = !cuisine.active;
    setCuisines(cuisines.map(c => 
      c.id === cuisine.id ? { ...c, active: newActive } : c
    ));
    try {
      await supabase.from("cuisines").update({ active: newActive }).eq("id", cuisine.id);
    } catch (err: any) {
      useToastStore.getState().addToast(`Failed: ${err.message}`, "error");
      setCuisines(cuisines.map(c => 
        c.id === cuisine.id ? { ...c, active: !newActive } : c
      ));
    }
  };

  const filteredCuisines = cuisines.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="px-8">Loading cuisines...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Cuisines</h1>
          <p className="text-sm text-[var(--color-outline)] mt-1">Manage food categories and cuisines</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-bold text-sm"
        >
          + Add Cuisine
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-[10px] font-bold uppercase">Total Cuisines</p>
          <p className="text-2xl font-black text-[var(--color-on-surface)]">{cuisines.length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-[10px] font-bold uppercase">Active</p>
          <p className="text-2xl font-black text-green-600">{cuisines.filter(c => c.active).length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-[10px] font-bold uppercase">Total Items</p>
          <p className="text-2xl font-black text-[var(--color-on-surface)]">{cuisines.reduce((acc, c) => acc + (c.item_count || 0), 0)}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-[10px] font-bold uppercase">Vendors</p>
          <p className="text-2xl font-black text-[var(--color-on-surface)]">{cuisines.reduce((acc, c) => acc + (c.vendor_count || 0), 0)}</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cuisines..."
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredCuisines.map((cuisine) => (
            <div 
              key={cuisine.id} 
              className={`p-4 rounded-2xl border transition-all ${
                cuisine.active ? "border-[var(--color-border-subtle)] bg-white" : "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  <span className="text-xl">🍽️</span>
                </div>
                <button
                  onClick={() => toggleActive(cuisine)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    cuisine.active 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {cuisine.active ? "Active" : "Inactive"}
                </button>
              </div>
              <h3 className="font-black text-[var(--color-on-surface)] text-lg">{cuisine.name}</h3>
              <div className="flex gap-4 mt-2 text-xs text-[var(--color-outline)]">
                <span>{cuisine.item_count || 0} items</span>
                <span>•</span>
                <span>{cuisine.vendor_count || 0} vendors</span>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
                <button
                  onClick={() => setEditingCuisine(cuisine)}
                  className="flex-1 py-2 text-[var(--color-primary)] font-bold text-sm border border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)] hover:text-white transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCuisine(cuisine.id)}
                  className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Add New Cuisine</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--color-outline-variant)]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] block mb-1">Cuisine Name *</label>
                <input
                  type="text"
                  value={newCuisine.name}
                  onChange={(e) => setNewCuisine({ ...newCuisine, name: e.target.value })}
                  className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm"
                  placeholder="e.g., Mexican, Thai"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] block mb-1">Image URL (optional)</label>
                <input
                  type="text"
                  value={newCuisine.image_url}
                  onChange={(e) => setNewCuisine({ ...newCuisine, image_url: e.target.value })}
                  className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm"
                  placeholder="https://..."
                />
              </div>
              <button
                onClick={handleAddCuisine}
                disabled={loading}
                className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Cuisine"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCuisine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Edit Cuisine</h2>
              <button onClick={() => setEditingCuisine(null)} className="text-[var(--color-outline-variant)]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] block mb-1">Cuisine Name</label>
                <input
                  type="text"
                  value={editingCuisine.name}
                  onChange={(e) => setEditingCuisine({ ...editingCuisine, name: e.target.value })}
                  className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingCuisine.active}
                  onChange={(e) => setEditingCuisine({ ...editingCuisine, active: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="active" className="text-sm font-bold">Active (visible to users)</label>
              </div>
              <button
                onClick={handleUpdateCuisine}
                disabled={loading}
                className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold disabled:opacity-50"
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
