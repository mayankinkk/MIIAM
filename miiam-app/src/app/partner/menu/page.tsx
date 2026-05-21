"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  vendor_id: string;
  available: boolean;
  description?: string;
  is_veg?: boolean;
}

interface Vendor {
  id: string;
  shop_name: string;
  type?: string;
}

const defaultCategories = ["Main Course", "Starters", "Beverages", "Desserts", "Snacks", "Rice", "Breads"];

export default function PartnerMenuPage() {
  const supabase = createClient();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "Main Course",
    description: "",
    is_veg: true,
  });

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [selectedVendorId]);

  async function loadVendors() {
    const { data } = await supabase
      .from("vendors")
      .select("id, shop_name, type")
      .order("shop_name");
    if (data) {
      setVendors(data);
      if (data.length > 0 && !selectedVendorId) {
        setSelectedVendorId(data[0].id);
      }
    }
  }

  async function loadItems() {
    setLoading(true);
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("vendor_id", selectedVendorId)
      .order("category")
      .order("name");
    if (data) setItems(data);
    setLoading(false);
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      alert("Please fill in item name and price");
      return;
    }
    try {
      const { error } = await supabase.from("menu_items").insert({
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        vendor_id: selectedVendorId,
        description: newItem.description || null,
        is_veg: newItem.is_veg,
        available: true,
      });
      if (error) throw error;
      setShowAddModal(false);
      setNewItem({ name: "", price: "", category: "Main Course", description: "", is_veg: true });
      loadItems();
    } catch (error: any) {
      alert("Failed: " + error.message);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: editingItem.name,
          price: editingItem.price,
          category: editingItem.category,
          description: editingItem.description,
          is_veg: editingItem.is_veg,
        })
        .eq("id", editingItem.id);
      if (error) throw error;
      setEditingItem(null);
      loadItems();
    } catch (error: any) {
      alert("Failed: " + error.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await supabase.from("menu_items").delete().eq("id", id);
      setItems(items.filter(i => i.id !== id));
    } catch (error: any) {
      alert("Failed: " + error.message);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await supabase
        .from("menu_items")
        .update({ available: !item.available })
        .eq("id", item.id);
      setItems(items.map(i => i.id === item.id ? { ...i, available: !i.available } : i));
    } catch (error: any) {
      alert("Failed: " + error.message);
    }
  };

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === "" ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Menu & Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your menu items and pricing</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold bg-white"
          >
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.shop_name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#ba001c] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#ba001c]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">restaurant_menu</span>
            <p className="text-slate-400 font-medium">No menu items found</p>
            {selectedVendor && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-[#ba001c] font-bold text-sm hover:underline"
              >
                Add your first item
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400">restaurant</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold text-slate-500">{item.category}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${item.is_veg ? 'text-green-600' : 'text-red-600'}`}>
                      <span className={`w-2 h-2 rounded-sm ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {item.is_veg ? 'Veg' : 'Non-Veg'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        item.available
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.available ? "Available" : "Unavailable"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <p className="font-extrabold text-slate-800">₹{item.price}</p>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
                      >
                        <span className="material-symbols-outlined text-slate-600 text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-red-500 text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">Add Menu Item</h2>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Item Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Butter Chicken"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="e.g., 280"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                >
                  {defaultCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Brief description of the item"
                  rows={2}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Type</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newItem.is_veg}
                      onChange={() => setNewItem({ ...newItem, is_veg: true })}
                      className="accent-[#ba001c]"
                    />
                    <span className="flex items-center gap-1 text-sm font-medium text-green-700">
                      <span className="w-3 h-3 bg-green-500 rounded-sm"></span> Veg
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!newItem.is_veg}
                      onChange={() => setNewItem({ ...newItem, is_veg: false })}
                      className="accent-[#ba001c]"
                    />
                    <span className="flex items-center gap-1 text-sm font-medium text-red-700">
                      <span className="w-3 h-3 bg-red-500 rounded-sm"></span> Non-Veg
                    </span>
                  </label>
                </div>
              </div>
              <button
                onClick={handleAddItem}
                className="w-full py-4 bg-[#ba001c] text-white font-extrabold rounded-2xl mt-4 hover:bg-[#a40017] transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingItem(null)}>
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">Edit Menu Item</h2>
              <button onClick={() => setEditingItem(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Item Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                >
                  {defaultCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Type</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editingItem.is_veg}
                      onChange={() => setEditingItem({ ...editingItem, is_veg: true })}
                      className="accent-[#ba001c]"
                    />
                    <span className="flex items-center gap-1 text-sm font-medium text-green-700">
                      <span className="w-3 h-3 bg-green-500 rounded-sm"></span> Veg
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!editingItem.is_veg}
                      onChange={() => setEditingItem({ ...editingItem, is_veg: false })}
                      className="accent-[#ba001c]"
                    />
                    <span className="flex items-center gap-1 text-sm font-medium text-red-700">
                      <span className="w-3 h-3 bg-red-500 rounded-sm"></span> Non-Veg
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateItem}
                  className="flex-1 py-4 bg-[#ba001c] text-white font-extrabold rounded-2xl hover:bg-[#a40017] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
