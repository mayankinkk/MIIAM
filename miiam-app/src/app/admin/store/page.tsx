"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import BlurImage from "@/components/BlurImage";

interface StoreItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  category: string;
  is_veg: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const BUCKET_OPTIONS = [
  { value: "under_99", label: "Under ₹99", emoji: "🔥", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "under_149", label: "Under ₹149", emoji: "💰", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "under_199", label: "Under ₹199", emoji: "⭐", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "under_249", label: "Under ₹249", emoji: "🎯", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  original_price: "",
  image_url: "",
  vendor_id: "",
  vendor_name: "",
  category: "under_99",
  is_veg: false,
  is_active: true,
  sort_order: "0",
};

export default function StoreItemsAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const { addToast } = useToastStore();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorResults, setVendorResults] = useState<{ id: string; shop_name: string }[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [csvUploading, setCsvUploading] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("store_items")
      .select("*")
      .order("category")
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) {
      addToast("Failed to load items: " + error.message, "error");
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, [supabase, addToast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const searchVendors = useCallback(async (q: string) => {
    if (q.length < 2) { setVendorResults([]); return; }
    const { data } = await supabase
      .from("vendors")
      .select("id, shop_name")
      .ilike("shop_name", `%${q}%`)
      .limit(10);
    setVendorResults(data || []);
  }, [supabase]);

  useEffect(() => {
    const t = setTimeout(() => searchVendors(vendorSearch), 300);
    return () => clearTimeout(t);
  }, [vendorSearch, searchVendors]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast("Image must be under 5MB", "error");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `store/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("store-images").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("store-images").getPublicUrl(path);
      setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      addToast("Image uploaded!", "success");
    } catch {
      addToast("Failed to upload image", "error");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { addToast("Name is required", "error"); return; }
    if (!form.price || Number(form.price) <= 0) { addToast("Valid price is required", "error"); return; }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      image_url: form.image_url || null,
      vendor_id: form.vendor_id || null,
      vendor_name: form.vendor_name || null,
      category: form.category,
      is_veg: form.is_veg,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    };

    if (editingItem) {
      const { error } = await supabase.from("store_items").update(payload).eq("id", editingItem.id);
      if (error) { addToast("Update failed: " + error.message, "error"); return; }
      addToast("Item updated!", "success");
    } else {
      const { error } = await supabase.from("store_items").insert(payload);
      if (error) { addToast("Insert failed: " + error.message, "error"); return; }
      addToast("Item created!", "success");
    }
    setShowModal(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
    loadItems();
  };

  const handleDelete = async (item: StoreItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    const { error } = await supabase.from("store_items").delete().eq("id", item.id);
    if (error) { addToast("Delete failed", "error"); return; }
    addToast("Item deleted", "success");
    loadItems();
  };

  const handleToggleActive = async (item: StoreItem) => {
    const { error } = await supabase.from("store_items").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) { addToast("Toggle failed", "error"); return; }
    loadItems();
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { addToast("Please upload a CSV file", "error"); return; }

    setCsvUploading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { addToast("CSV must have a header row + data", "error"); setCsvUploading(false); return; }

      const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
      const required = ["name", "price"];
      const missing = required.filter((r) => !header.includes(r));
      if (missing.length > 0) {
        addToast(`Missing columns: ${missing.join(", ")}`, "error");
        setCsvUploading(false);
        return;
      }

      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        header.forEach((h, i) => { row[h] = values[i] || ""; });
        return row;
      }).filter((r) => r.name && r.price);

      if (rows.length === 0) { addToast("No valid rows found", "error"); setCsvUploading(false); return; }

      const payload = rows.map((r) => ({
        name: r.name,
        description: r.description || null,
        price: parseFloat(r.price) || 0,
        original_price: r.original_price ? parseFloat(r.original_price) : null,
        image_url: r.image_url || null,
        vendor_name: r.vendor_name || null,
        category: r.category || "under_99",
        is_veg: r.is_veg === "true" || r.is_veg === "1",
        is_active: true,
        sort_order: 0,
      }));

      const { error } = await supabase.from("store_items").insert(payload);
      if (error) { addToast("Upload failed: " + error.message, "error"); }
      else { addToast(`${rows.length} items imported!`, "success"); loadItems(); }
    } catch {
      addToast("Failed to parse CSV", "error");
    }
    setCsvUploading(false);
    e.target.value = "";
  };

  const openEditModal = (item: StoreItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      original_price: item.original_price ? String(item.original_price) : "",
      image_url: item.image_url || "",
      vendor_id: item.vendor_id || "",
      vendor_name: item.vendor_name || "",
      category: item.category,
      is_veg: item.is_veg,
      is_active: item.is_active,
      sort_order: String(item.sort_order),
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const filteredItems = items.filter((item) => {
    const catMatch = filterCategory === "all" || item.category === filterCategory;
    const searchMatch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  const stats = useMemo(() => {
    const byCategory = BUCKET_OPTIONS.map((b) => ({
      ...b,
      count: items.filter((i) => i.category === b.value && i.is_active).length,
    }));
    return { total: items.length, active: items.filter((i) => i.is_active).length, byCategory };
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Store Items</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage Under ₹99/149/199/249 store items</p>
        </div>
        <div className="flex items-center gap-3">
          <label className={`px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 active:scale-95 transition-all cursor-pointer flex items-center gap-2 ${csvUploading ? "opacity-50 pointer-events-none" : ""}`}>
            <span className="material-symbols-outlined text-lg">upload_file</span>
            {csvUploading ? "Importing..." : "Import CSV"}
            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" disabled={csvUploading} />
          </label>
          <button onClick={openCreateModal} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            Add Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.total}</p>
        </div>
        {stats.byCategory.map((cat) => (
          <div key={cat.value} className={`rounded-xl p-4 border shadow-sm ${cat.color}`}>
            <p className="text-xs font-bold uppercase">{cat.emoji} {cat.label}</p>
            <p className="text-2xl font-black mt-1">{cat.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search items or vendors..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCategory("all")} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterCategory === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
          {BUCKET_OPTIONS.map((b) => (
            <button key={b.value} onClick={() => setFilterCategory(b.value)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterCategory === b.value ? b.color + " border" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {b.emoji} {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <span className="material-symbols-outlined text-gray-300 text-5xl mb-3">inventory_2</span>
          <p className="font-bold text-gray-900 text-lg">No items found</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Item" to create your first store item</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Item</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Category</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Price</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Vendor</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const bucket = BUCKET_OPTIONS.find((b) => b.value === item.category);
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                            {item.image_url ? (
                              <BlurImage src={item.image_url} alt={item.name} fill className="w-full h-full" sizes="40px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-300 text-lg">image</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate max-w-[200px]">{item.name}</p>
                            {item.description && <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{item.description}</p>}
                          </div>
                          {item.is_veg && <span className="w-3 h-3 border-2 border-green-600 rounded-sm flex-shrink-0" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${bucket?.color || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {bucket?.emoji} {bucket?.label || item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-bold text-gray-900">₹{item.price}</span>
                          {item.original_price && <span className="text-xs text-gray-400 line-through ml-1">₹{item.original_price}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{item.vendor_name || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleActive(item)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.is_active ? "bg-blue-600" : "bg-gray-300"}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${item.is_active ? "translate-x-4.5" : "translate-x-0.5"}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(item)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => handleDelete(item)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-black text-gray-900">{editingItem ? "Edit Item" : "Add Store Item"}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Image</label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                    {form.image_url ? (
                      <>
                        <BlurImage src={form.image_url} alt="Preview" fill className="w-full h-full" sizes="96px" />
                        <button onClick={() => setForm((p) => ({ ...p, image_url: "" }))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px]">close</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-gray-300 text-2xl">image</span>
                        <span className="text-[9px] text-gray-400 mt-1">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">
                      <span className="material-symbols-outlined text-sm">upload</span>
                      {uploading ? "Uploading..." : "Upload Image"}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                    <p className="text-[10px] text-gray-400 mt-2">JPG, PNG, WebP. Max 5MB.</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Item Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. Chicken Biryani" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" placeholder="Short description..." />
              </div>

              {/* Price Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="99" min="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Original Price (₹)</label>
                  <input type="number" value={form.original_price} onChange={(e) => setForm((p) => ({ ...p, original_price: e.target.value }))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="149 (for strikethrough)" min="0" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Price Bucket *</label>
                <div className="grid grid-cols-2 gap-2">
                  {BUCKET_OPTIONS.map((b) => (
                    <button key={b.value} onClick={() => setForm((p) => ({ ...p, category: b.value }))} className={`p-3 rounded-xl text-xs font-bold border-2 transition-all text-left ${form.category === b.value ? b.color + " border-current" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      {b.emoji} {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vendor Search */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Vendor / Restaurant</label>
                <div className="relative">
                  <input type="text" value={form.vendor_name || vendorSearch} onChange={(e) => { setVendorSearch(e.target.value); setForm((p) => ({ ...p, vendor_name: "", vendor_id: "" })); }} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" placeholder="Search restaurant name..." />
                  {vendorResults.length > 0 && !form.vendor_id && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                      {vendorResults.map((v) => (
                        <button key={v.id} onClick={() => { setForm((p) => ({ ...p, vendor_id: v.id, vendor_name: v.shop_name })); setVendorResults([]); setVendorSearch(""); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0">
                          {v.shop_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {form.vendor_id && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-blue-600 font-bold">{form.vendor_name}</span>
                    <button onClick={() => setForm((p) => ({ ...p, vendor_id: "", vendor_name: "" }))} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                  </div>
                )}
              </div>

              {/* Veg Toggle + Sort Order */}
              <div className="flex gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm((p) => ({ ...p, is_veg: !p.is_veg }))} className={`relative w-10 h-6 rounded-full transition-colors ${form.is_veg ? "bg-emerald-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_veg ? "left-[18px]" : "left-0.5"}`} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Veg</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))} className={`relative w-10 h-6 rounded-full transition-colors ${form.is_active ? "bg-blue-600" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? "left-[18px]" : "left-0.5"}`} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Active</span>
                </label>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Sort</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="0" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={uploading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20">
                {editingItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
