"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Cuisine {
  id: string;
  name: string;
  image_url?: string;
  item_count?: number;
  vendor_count?: number;
  active: boolean;
}

const defaultCuisines = [
  { id: "1", name: "North Indian", image_url: "", item_count: 156, vendor_count: 24, active: true },
  { id: "2", name: "South Indian", image_url: "", item_count: 89, vendor_count: 12, active: true },
  { id: "3", name: "Chinese", image_url: "", item_count: 134, vendor_count: 18, active: true },
  { id: "4", name: "Italian", image_url: "", item_count: 78, vendor_count: 14, active: true },
  { id: "5", name: "Biryani", image_url: "", item_count: 67, vendor_count: 22, active: true },
  { id: "6", name: "Fast Food", image_url: "", item_count: 198, vendor_count: 31, active: true },
  { id: "7", name: "Desserts", image_url: "", item_count: 45, vendor_count: 16, active: true },
  { id: "8", name: "Beverages", image_url: "", item_count: 112, vendor_count: 28, active: true },
  { id: "9", name: "Street Food", image_url: "", item_count: 87, vendor_count: 19, active: true },
  { id: "10", name: "Continental", image_url: "", item_count: 56, vendor_count: 8, active: true },
];

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
      alert("Please enter cuisine name");
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
      alert("Cuisine added!");
      setShowAddModal(false);
      setNewCuisine({ name: "", image_url: "" });
      loadCuisines();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
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
      alert("Cuisine updated!");
      setEditingCuisine(null);
      loadCuisines();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
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
      alert("Cuisine deleted!");
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = (cuisine: Cuisine) => {
    setCuisines(cuisines.map(c => 
      c.id === cuisine.id ? { ...c, active: !c.active } : c
    ));
  };

  const filteredCuisines = cuisines.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="px-8">Loading cuisines...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Cuisines</h1>
          <p className="text-sm text-slate-500 mt-1">Manage food categories and cuisines</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#ba001c] text-white px-6 py-3 rounded-xl font-bold text-sm"
        >
          + Add Cuisine
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase">Total Cuisines</p>
          <p className="text-2xl font-black text-slate-800">{cuisines.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase">Active</p>
          <p className="text-2xl font-black text-green-600">{cuisines.filter(c => c.active).length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase">Total Items</p>
          <p className="text-2xl font-black text-slate-800">{cuisines.reduce((acc, c) => acc + (c.item_count || 0), 0)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase">Vendors</p>
          <p className="text-2xl font-black text-slate-800">{cuisines.reduce((acc, c) => acc + (c.vendor_count || 0), 0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cuisines..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredCuisines.map((cuisine) => (
            <div 
              key={cuisine.id} 
              className={`p-4 rounded-2xl border transition-all ${
                cuisine.active ? "border-slate-100 bg-white" : "border-slate-200 bg-slate-50 opacity-60"
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
              <h3 className="font-black text-slate-800 text-lg">{cuisine.name}</h3>
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                <span>{cuisine.item_count || 0} items</span>
                <span>•</span>
                <span>{cuisine.vendor_count || 0} vendors</span>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setEditingCuisine(cuisine)}
                  className="flex-1 py-2 text-[#ba001c] font-bold text-sm border border-[#ba001c] rounded-lg hover:bg-[#ba001c] hover:text-white transition-all"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Add New Cuisine</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Cuisine Name *</label>
                <input
                  type="text"
                  value={newCuisine.name}
                  onChange={(e) => setNewCuisine({ ...newCuisine, name: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                  placeholder="e.g., Mexican, Thai"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Image URL (optional)</label>
                <input
                  type="text"
                  value={newCuisine.image_url}
                  onChange={(e) => setNewCuisine({ ...newCuisine, image_url: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                  placeholder="https://..."
                />
              </div>
              <button
                onClick={handleAddCuisine}
                disabled={loading}
                className="w-full py-3 bg-[#ba001c] text-white rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Cuisine"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCuisine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Edit Cuisine</h2>
              <button onClick={() => setEditingCuisine(null)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Cuisine Name</label>
                <input
                  type="text"
                  value={editingCuisine.name}
                  onChange={(e) => setEditingCuisine({ ...editingCuisine, name: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm"
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
                className="w-full py-3 bg-[#ba001c] text-white rounded-xl font-bold disabled:opacity-50"
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
