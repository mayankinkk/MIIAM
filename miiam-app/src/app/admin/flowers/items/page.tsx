"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/store/toastStore";


const defaultCategories = ["Bouquets", "Arrangements", "Combos", "Hampers", "Sympathy", "Corporate"];

interface FlowerItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  vendor_id?: string;
  created_at: string;
}

export default function FlowersItemsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { confirm } = useConfirm();
  const [items, setItems] = useState<FlowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, categories: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [vendors, setVendors] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FlowerItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Bouquets",
    price: "",
    description: "",
    image_url: "",
    vendor_id: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data: vendorsData, error: vendorError } = await supabase
        .from("vendors")
        .select("id, shop_name")
        .or("type.eq.flower,type.eq.flowers");
      if (vendorError) console.error("Vendor fetch error:", vendorError);
      if (vendorsData) setVendors(vendorsData);

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
    if (!newItem.name || !newItem.price || !newItem.vendor_id) {
      useToastStore.getState().addToast("Please fill in required fields (Name, Price, Vendor)", "error");
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
            image_url: newItem.image_url || null,
            vendor_id: newItem.vendor_id,
          })
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("flower_items").insert({
          name: newItem.name,
          category: newItem.category,
          price: parseFloat(newItem.price),
          description: newItem.description,
          image_url: newItem.image_url || null,
          vendor_id: newItem.vendor_id,
        });
        if (error) throw error;
      }

      resetModal();
      loadItems();
      useToastStore.getState().addToast(editingItem ? "Item updated!" : "Item added!", "success");
    } catch (error: any) {
      console.error("Error saving:", error);
      useToastStore.getState().addToast("Failed: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: "Delete", message: "Are you sure you want to delete this item?", variant: "danger" })) return;
    try {
      const { error } = await supabase.from("flower_items").delete().eq("id", id);
      if (error) throw error;
      setItems(items.filter(i => i.id !== id));
    } catch (error: any) {
      useToastStore.getState().addToast("Failed: " + error.message, "error");
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
      vendor_id: item.vendor_id || "",
    });
    setShowAddModal(true);
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setNewItem({ name: "", category: "Bouquets", price: "", description: "", image_url: "", vendor_id: "" });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === "" || item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesVendor = vendorFilter === "all" || item.vendor_id === vendorFilter;
    return matchesSearch && matchesCategory && matchesVendor;
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/flowers" className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Flowers Items</h1>
          <p className="text-[var(--color-outline)] text-sm">Manage flower products and catalog</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-bold text-sm hover:bg-[#a00018]">
          + Add Item
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-border-subtle)]">
          <p className="text-[var(--color-outline-variant)] text-xs font-bold">TOTAL ITEMS</p>
          <p className="text-2xl font-black text-[var(--color-on-surface)] mt-1">{stats.total}</p>
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)] material-symbols-outlined">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by item name..."
            className="w-full pl-10 pr-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]">
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:border-[var(--color-primary)]">
          <option value="all">All Vendors</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.shop_name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--color-outline)]">Loading items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-outline)] bg-[var(--color-surface-container-lowest)] rounded-xl">
          <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">local_florist</span>
          <p className="mt-4 font-bold">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-[var(--color-surface-container)] relative">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]/60">local_florist</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">{item.category}</span>
                <p className="text-xs text-[var(--color-outline)] mt-1">{vendors.find(v => v.id === item.vendor_id)?.shop_name || "Unknown Vendor"}</p>
                <p className="font-bold text-[var(--color-on-surface)] mt-1">{item.name}</p>
                <p className="text-sm text-[var(--color-outline)] mt-1 line-clamp-2">{item.description || "No description"}</p>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xl font-black text-[var(--color-on-surface)]">₹{item.price}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEditModal(item)} className="flex-1 py-2 bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] rounded-lg font-bold text-xs hover:bg-[var(--color-surface-container-high)]">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs hover:bg-red-100">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-[var(--color-surface-container-lowest)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-[var(--color-on-surface)]">{editingItem ? "Edit Item" : "Add Item"}</h2>
                <button onClick={resetModal} className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]">
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Item Name *</label>
                <input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none" placeholder="Enter item name" />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Vendor *</label>
                <select value={newItem.vendor_id} onChange={(e) => setNewItem({ ...newItem, vendor_id: e.target.value })} className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none">
                  <option value="">Select Vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.shop_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Category *</label>
                <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Price (₹) *</label>
                <input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-1 block">Description</label>
                <textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="w-full p-3 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:border-[var(--color-primary)] focus:outline-none" placeholder="Enter description" rows={3} />
              </div>
              <ImageUpload
                value={newItem.image_url}
                onChange={(url) => setNewItem({ ...newItem, image_url: url })}
                bucket="flower-images"
                folder="flower-items"
                label="Product Image"
                previewHeight="h-32"
              />
            </div>
            <div className="p-6 border-t flex gap-4">
              <button onClick={resetModal} className="flex-1 py-3 border border-[var(--color-border-subtle)] rounded-xl font-bold text-sm hover:bg-[var(--color-surface-subtle)]">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] disabled:opacity-50">
                {saving ? "Saving..." : editingItem ? "Update" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}