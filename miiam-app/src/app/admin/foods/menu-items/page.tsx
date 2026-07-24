"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/store/toastStore";
import BlurImage from "@/components/BlurImage";

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
  is_available: boolean;
}

export default function AdminMenuItemsPage() {
  const { confirm } = useConfirm();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<{ id: string; shop_name?: string; name?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
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
    const { data: vendorsData } = await supabase.from("vendors").select("id, shop_name");
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
      useToastStore.getState().addToast("Please fill all required fields", "error");
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
        is_available: true,
      });
      if (error) throw error;
      useToastStore.getState().addToast("Menu item added!", "success");
      setShowAddModal(false);
      setNewItem({ name: "", price: "", category: "Main Course", vendor_id: "", image_url: "" });
      loadData();
    } catch (error: unknown) {
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
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
          image_url: editingItem.image_url || null,
          is_available: editingItem.is_available,
        })
        .eq("id", editingItem.id);
      if (error) throw error;
      useToastStore.getState().addToast("Item updated!", "success");
      setEditingItem(null);
      loadData();
    } catch (error: unknown) {
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!await confirm({ title: "Delete", message: "Are you sure you want to delete this item?", variant: "danger" })) return;
    setLoading(true);
    try {
      await supabase.from("menu_items").delete().eq("id", id);
      setItems(items.filter(i => i.id !== id));
      useToastStore.getState().addToast("Item deleted!", "success");
    } catch (error: unknown) {
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { useToastStore.getState().addToast("Please upload a CSV file", "error"); return; }

    setCsvUploading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { useToastStore.getState().addToast("CSV must have a header + data rows", "error"); setCsvUploading(false); return; }

      const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
      if (!header.includes("name") || !header.includes("price") || !header.includes("vendor_id")) {
        useToastStore.getState().addToast("CSV must have: name, price, vendor_id columns", "error");
        setCsvUploading(false);
        return;
      }

      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        header.forEach((h, i) => { row[h] = values[i] || ""; });
        return row;
      }).filter((r) => r.name && r.price && r.vendor_id);

      if (rows.length === 0) { useToastStore.getState().addToast("No valid rows found", "error"); setCsvUploading(false); return; }

      const payload = rows.map((r) => ({
        name: r.name,
        price: parseFloat(r.price) || 0,
        category: r.category || "Main Course",
        vendor_id: r.vendor_id,
        image_url: r.image_url || null,
        is_available: true,
      }));

      const { error } = await supabase.from("menu_items").insert(payload);
      if (error) { useToastStore.getState().addToast("Upload failed: " + error.message, "error"); }
      else { useToastStore.getState().addToast(`${rows.length} menu items imported!`, "success"); loadData(); }
    } catch {
      useToastStore.getState().addToast("Failed to parse CSV", "error");
    }
    setCsvUploading(false);
    e.target.value = "";
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await supabase
        .from("menu_items")
        .update({ is_available: !item.is_available })
        .eq("id", item.id);
      setItems(items.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    } catch (error: unknown) {
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
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
        <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Menu Items</h1>
        <div className="flex items-center gap-3">
          <label className={`bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] text-[var(--color-on-surface-variant)] px-4 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-[var(--color-surface-subtle)] flex items-center gap-2 ${csvUploading ? "opacity-50 pointer-events-none" : ""}`}>
            <span className="material-symbols-outlined text-sm">upload_file</span>
            {csvUploading ? "Importing..." : "Import CSV"}
            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" disabled={csvUploading} />
          </label>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-bold text-sm"
          >
            + Add Item
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="p-4 border-b flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold"
          >
            <option value="all">All Vendors</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.shop_name || v.name}</option>
            ))}
          </select>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[var(--color-surface-subtle)]">
            <tr>
              <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Item</th>
              <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Vendor</th>
              <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Category</th>
              <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Status</th>
              <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase text-right">Price</th>
              <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--color-outline-variant)]">No items found</td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className={item.is_available ? "" : "opacity-50"}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--color-surface-container)] rounded-lg overflow-hidden">
                        {item.image_url ? (
                          <BlurImage src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--color-outline-variant)]/60">
                            <span className="material-symbols-outlined">restaurant</span>
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-[var(--color-on-surface)]">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[var(--color-outline)]">
                    {vendors.find(v => v.id === item.vendor_id)?.shop_name || 
                     vendors.find(v => v.id === item.vendor_id)?.name || "-"}
                  </td>
                  <td className="p-4">
                    <span className="bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] px-2 py-1 rounded-lg text-[10px] font-bold">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        item.is_available 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" 
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {item.is_available ? "Available" : "Unavailable"}
                    </button>
                  </td>
                  <td className="p-4 text-right font-black text-[var(--color-on-surface)]">₹{item.price}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="text-[var(--color-primary)] font-bold hover:underline"
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
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Add Menu Item</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--color-outline-variant)]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] block mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm"
                  placeholder="Item name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] block mb-1">Vendor *</label>
                <select
                  value={newItem.vendor_id}
                  onChange={(e) => setNewItem({ ...newItem, vendor_id: e.target.value })}
                  className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.shop_name || v.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--color-on-surface-variant)] block mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Sides">Sides</option>
                    <option value="Bakery">Bakery</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-on-surface-variant)] block mb-1">Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)]">₹</span>
                    <input
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      className="w-full pl-7 p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <ImageUpload
                value={newItem.image_url}
                onChange={(url) => setNewItem({ ...newItem, image_url: url })}
                bucket="menu-images"
                folder="menu-items"
                label="Item Image"
                previewHeight="h-32"
              />
              <button
                onClick={handleAddItem}
                disabled={loading}
                className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">Edit Menu Item</h2>
              <button onClick={() => setEditingItem(null)} className="text-[var(--color-outline-variant)]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] block mb-1">Item Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--color-on-surface-variant)] block mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm"
                  >
                    <option value="Main Course">Main Course</option>
                    <option value="Starters">Starters</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Bakery">Bakery</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-on-surface-variant)] block mb-1">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)]">₹</span>
                    <input
                      type="number"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                      className="w-full pl-7 p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
              <ImageUpload
                value={editingItem.image_url || ""}
                onChange={(url) => setEditingItem({ ...editingItem, image_url: url })}
                bucket="menu-images"
                folder="menu-items"
                label="Item Image"
                previewHeight="h-32"
              />
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="available"
                  checked={editingItem.is_available}
                  onChange={(e) => setEditingItem({ ...editingItem, is_available: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="available" className="text-sm font-bold">Available</label>
              </div>
              <button
                onClick={handleUpdateItem}
                disabled={loading}
                className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold disabled:opacity-50"
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
