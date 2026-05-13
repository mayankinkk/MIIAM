"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const mockCategories = ["Bouquets", "Arrangements", "Combos", "Hampers", "Sympathy", "Corporate"];

interface FlowerItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
}

export default function FlowersItemsPage() {
  const [items, setItems] = useState<FlowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, categories: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FlowerItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Bouquets",
    price: "",
    description: "",
    image_url: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("flower_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);

      const categories = new Set((data || []).map((i: FlowerItem) => i.category));
      setStats({ total: data?.length || 0, categories: categories.size });
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newItem.name || !newItem.price) {
      alert("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("flower_items")
          .update({
            name: newItem.name,
            category: newItem.category,
            price: parseFloat(newItem.price),
            description: newItem.description,
            image_url: newItem.image_url,
          })
          .eq("id", editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("flower_items").insert({
          name: newItem.name,
          category: newItem.category,
          price: parseFloat(newItem.price),
          description: newItem.description,
          image_url: newItem.image_url,
        });

        if (error) throw error;
      }

      resetModal();
      loadItems();
      alert(editingItem ? "Item updated!" : "Item added!");
    } catch (error: any) {
      console.error("Error saving:", error);
      alert("Failed: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;

    try {
      const { error } = await supabase.from("flower_items").delete().eq("id", id);
      if (error) throw error;
      setItems(items.filter(i => i.id !== id));
      alert("Item deleted!");
    } catch (error: any) {
      console.error("Error deleting:", error);
      alert("Failed: " + error.message);
    }
  };

  const openEditModal = (item: FlowerItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      image_url: item.image_url,
    });
    setShowAddModal(true);
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setNewItem({ name: "", category: "Bouquets", price: "", description: "", image_url: "" });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === "" || item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/flowers" className="text-slate-400 hover:text-slate-600">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-800">Flowers Items</h1>
          <p className="text-slate-500 text-sm">Manage flower products and catalog</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#ba001c] text-white rounded-lg font-bold text-sm hover:bg-[#a00018]"
        >
          + Add Item
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-xs font-bold">TOTAL ITEMS</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
          <p className="text-purple-600 text-xs font-bold">CATEGORIES</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{stats.categories}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
          <p className="text-rose-600 text-xs font-bold">BOUQUETS</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{items.filter(i => i.category === "Bouquets").length}</p>
        </div>
        <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
          <p className="text-pink-600 text-xs font-bold">COMBOS</p>
          <p className="text-2xl font-black text-pink-700 mt-1">{items.filter(i => i.category === "Combos").length}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by item name..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
        >
          <option value="all">All Categories</option>
          {mockCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl">
          <span className="material-symbols-outlined text-5xl text-slate-300">local_florist</span>
          <p className="mt-4 font-bold">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-slate-100 relative">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="material-symbols-outlined text-4xl text-slate-300">local_florist</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">{item.category}</span>
                <p className="font-bold text-slate-800 mt-2">{item.name}</p>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description || "No description"}</p>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xl font-black text-slate-800">₹{item.price}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEditModal(item)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs hover:bg-red-100">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">{editingItem ? "Edit Item" : "Add Item"}</h2>
                <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Item Name *</label>
                <input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="Enter item name" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Category *</label>
                <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none">
                  {mockCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Price (₹) *</label>
                <input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Description</label>
                <textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="Enter description" rows={3} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Image URL</label>
                <input type="text" value={newItem.image_url} onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="https://..." />
              </div>
            </div>
            <div className="p-6 border-t flex gap-4">
              <button onClick={resetModal} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] disabled:opacity-50">
                {saving ? "Saving..." : editingItem ? "Update" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}