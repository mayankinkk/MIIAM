"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-urls";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

const defaultCategories = [
  "Bouquets",
  "Arrangements",
  "Combos",
  "Hampers",
  "Sympathy",
  "Corporate",
];

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
  const [vendors, setVendors] = useState<{ id: string; shop_name: string }[]>([]);
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
      if (vendorError) logger.error({ err: vendorError }, "Vendor fetch error");
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
      logger.error({ err: error }, "Error loading items");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newItem.name || !newItem.price || !newItem.vendor_id) {
      useToastStore
        .getState()
        .addToast("Please fill in required fields (Name, Price, Vendor)", "error");
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
    } catch (error: unknown) {
      logger.error({ err: error }, "Error saving item");
      useToastStore
        .getState()
        .addToast("Failed: " + (error instanceof Error ? error.message : "Unknown error"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: "Delete",
        message: "Are you sure you want to delete this item?",
        variant: "danger",
      }))
    )
      return;
    try {
      const { error } = await supabase.from("flower_items").delete().eq("id", id);
      if (error) throw error;
      setItems(items.filter((i) => i.id !== id));
    } catch (error: unknown) {
      useToastStore
        .getState()
        .addToast("Failed: " + (error instanceof Error ? error.message : "Unknown error"), "error");
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
    setNewItem({
      name: "",
      category: "Bouquets",
      price: "",
      description: "",
      image_url: "",
      vendor_id: "",
    });
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchTerm === "" || item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesVendor = vendorFilter === "all" || item.vendor_id === vendorFilter;
    return matchesSearch && matchesCategory && matchesVendor;
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/flowers"
          className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
        >
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Flowers Items</h1>
          <p className="text-sm text-[var(--color-outline)]">Manage flower products and catalog</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-on-primary rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold hover:bg-[#a00018]"
        >
          + Add Item
        </button>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4">
          <p className="text-xs font-bold text-[var(--color-outline-variant)]">TOTAL ITEMS</p>
          <p className="mt-1 text-2xl font-black text-[var(--color-on-surface)]">{stats.total}</p>
        </div>
        <div className="bg-accent/10 border-accent/20 rounded-xl border p-4">
          <p className="text-accent text-xs font-bold">CATEGORIES</p>
          <p className="text-accent mt-1 text-2xl font-black">{stats.categories}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-bold text-rose-600">BOUQUETS</p>
          <p className="mt-1 text-2xl font-black text-rose-700">
            {items.filter((i) => i.category === "Bouquets").length}
          </p>
        </div>
        <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
          <p className="text-xs font-bold text-pink-600">COMBOS</p>
          <p className="mt-1 text-2xl font-black text-pink-700">
            {items.filter((i) => i.category === "Combos").length}
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by item name..."
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] py-3 pr-4 pl-10 focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none"
        >
          <option value="all">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.shop_name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[var(--color-outline)]">Loading items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl bg-[var(--color-surface-container-lowest)] py-12 text-center text-[var(--color-outline)]">
          <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">
            local_florist
          </span>
          <p className="mt-4 font-bold">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] transition-shadow hover:shadow-lg"
            >
              <div className="relative h-40 bg-[var(--color-surface-container)]">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized={!canOptimizeImage(item.image_url)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]/60">
                      local_florist
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                  {item.category}
                </span>
                <p className="mt-1 text-xs text-[var(--color-outline)]">
                  {vendors.find((v) => v.id === item.vendor_id)?.shop_name || "Unknown Vendor"}
                </p>
                <p className="mt-1 font-bold text-[var(--color-on-surface)]">{item.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--color-outline)]">
                  {item.description || "No description"}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xl font-black text-[var(--color-on-surface)]">₹{item.price}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 rounded-lg bg-[var(--color-surface-container)] py-2 text-xs font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-[var(--color-surface-container-lowest)]">
            <div className="sticky top-0 border-b bg-[var(--color-surface-container-lowest)] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-[var(--color-on-surface)]">
                  {editingItem ? "Edit Item" : "Add Item"}
                </h2>
                <button
                  onClick={resetModal}
                  className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
                >
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                  Vendor *
                </label>
                <select
                  value={newItem.vendor_id}
                  onChange={(e) => setNewItem({ ...newItem, vendor_id: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.shop_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                  Category *
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[var(--color-on-surface-variant)]">
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="Enter description"
                  rows={3}
                />
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
            <div className="flex gap-4 border-t p-6">
              <button
                onClick={resetModal}
                className="flex-1 rounded-xl border border-[var(--color-border-subtle)] py-3 text-sm font-bold hover:bg-[var(--color-surface-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-on-primary flex-1 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold hover:bg-[#a00018] disabled:opacity-50"
              >
                {saving ? "Saving..." : editingItem ? "Update" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
