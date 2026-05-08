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
  vendor?: {
    shop_name: string;
    name: string;
  };
  available: boolean;
}

export default function AdminMenuItemsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "Main Course",
    vendor_id: "",
    image_url: "",
  });

  useEffect(() => {
    loadData();
  }, [supabase]);

  async function loadData() {
    setLoading(true);
    const { data: vendorsData } = await supabase.from("vendors").select("id, shop_name, name");
    if (vendorsData) setVendors(vendorsData);

    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.vendor_id) {
      alert("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("menu_items").insert({
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        vendor_id: newItem.vendor_id,
        image_url: newItem.image_url || null,
        available: true,
      });
      if (error) throw error;
      alert("Menu item added!");
      setShowAddModal(false);
      setNewItem({ name: "", price: "", category: "Main Course", vendor_id: "", image_url: "" });
      loadData();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: editingItem.name,
          price: editingItem.price,
          category: editingItem.category,
          available: editingItem.available,
        })
        .eq("id", editingItem.id);
      if (error) throw error;
      alert("Item updated!");
      setEditingItem(null);
      loadData();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    setLoading(true);
    try {
      await supabase.from("menu_items").delete().eq("id", id);
      setItems(items.filter(i => i.id !== id));
      alert("Item deleted!");
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
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
      alert(`Failed: ${error.message}`);
    }
  };

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  
  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesVendor = vendorFilter === "all" || item.vendor_id === vendorFilter;
    return matchesSearch && matchesCategory && matchesVendor;
  });

  if (loading) return <div className="px-8">Loading menu items...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-800">Menu Items</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#ba001c] text-white px-6 py-3 rounded-xl font-bold text-sm"
        >
          + Add Item
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold"
          >
            <option value="all">All Vendors</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.shop_name || v.name}</option>
            ))}
          </select>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Item</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Vendor</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Category</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Status</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">Price</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">No items found</td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className={item.available ? "" : "opacity-50"}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <span className="material-symbols-outlined">restaurant</span>
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-slate-800">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">
                    {vendors.find(v => v.id === item.vendor_id)?.shop_name || 
                     vendors.find(v => v.id === item.vendor_id)?.name || "-"}
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        item.available 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.available ? "Available" : "Unavailable"}
                    </button>
                  </td>
                  <td className="p-4 text-right font-black text-slate-800">₹{item.price}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="text-[#ba001c] font-bold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Add Menu Item</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                  placeholder="Item name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Vendor *</label>
                <select
                  value={newItem.vendor_id}
                  onChange={(e) => setNewItem({ ...newItem, vendor_id: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.shop_name || v.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Sides">Sides</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      className="w-full pl-7 p-3 border border-slate-200 rounded-xl text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddItem}
                disabled={loading}
                className="w-full py-3 bg-[#ba001c] text-white rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Edit Menu Item</h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Item Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    <input
                      type="number"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                      className="w-full pl-7 p-3 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="available"
                  checked={editingItem.available}
                  onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="available" className="text-sm font-bold">Available</label>
              </div>
              <button
                onClick={handleUpdateItem}
                disabled={loading}
                className="w-full py-3 bg-[#ba001c] text-white rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
