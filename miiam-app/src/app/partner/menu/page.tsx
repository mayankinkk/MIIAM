"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/store/toastStore";
import { getVendorForUser } from "@/lib/vendor";
import BlurImage from "@/components/BlurImage";

interface Vendor {
  id: string;
  shop_name: string;
  type?: string;
  categories?: string[];
}

interface BaseItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  images?: string[];
  created_at: string;
  menu_slot?: string;
}

interface MenuItem extends BaseItem {
  vendor_id: string;
  available: boolean;
  description?: string;
  is_veg?: boolean;
  is_featured?: boolean;
  stock?: number;
  original_price?: number | null;
  discount_percent?: number | null;
  images?: string[];
}

interface GroceryItem extends BaseItem {
  stock: number;
}

interface PharmacyItem extends BaseItem {
  stock: number;
  requires_prescription: boolean;
}

interface FlowerItem extends BaseItem {
  description?: string;
}

type AnyItem = MenuItem | GroceryItem | PharmacyItem | FlowerItem;

const CATEGORIES: Record<string, string[]> = {
  food: ["Main Course", "Starters", "Beverages", "Desserts", "Snacks", "Rice", "Breads"],
  grocery: ["Fruits", "Vegetables", "Dairy", "Bakery", "Spices", "Pulses", "Oils", "Beverages"],
  pharmacy: ["Pain Relief", "Antibiotics", "Vitamins", "Diabetes", "Blood Pressure", "Heart Care", "Cold & Flu", "Skin Care", "Baby Care"],
  flowers: ["Bouquets", "Arrangements", "Combos", "Hampers", "Sympathy", "Corporate"],
};

const TABLE_MAP: Record<string, string> = {
  food: "menu_items",
  grocery: "grocery_products",
  pharmacy: "pharmacy_medicines",
  flowers: "flower_items",
};

function getVendorKey(type?: string): string {
  if (type === "grocery") return "grocery";
  if (type === "pharmacy") return "pharmacy";
  if (type === "flowers") return "flowers";
  return "food";
}

export default function PartnerMenuPage() {
  const supabase = useMemo(() => createClient(), []);
  const { confirm } = useConfirm();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [items, setItems] = useState<AnyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AnyItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [newItem, setNewItem] = useState<{
    name: string;
    price: string;
    category: string;
    description: string;
    is_veg: boolean;
    stock: string;
    requires_prescription: boolean;
    imageFiles: File[];
    image_url: string;
    showUrlInput: boolean;
    has_discount: boolean;
    discount_percent: number;
    is_featured: boolean;
    menu_slot?: string;
  }>({
    name: "",
    price: "",
    category: "",
    description: "",
    is_veg: true,
    stock: "",
    requires_prescription: false,
    imageFiles: [],
    image_url: "",
    showUrlInput: false,
    has_discount: false,
    discount_percent: 20,
    is_featured: false,
  });
  const [uploading, setUploading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [vendorCategories, setVendorCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEditUrlInput, setShowEditUrlInput] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkValue, setBulkValue] = useState<string>("");
  const itemsRef = useRef(items);
  const selectedItemsRef = useRef(selectedItems);
  itemsRef.current = items;
  selectedItemsRef.current = selectedItems;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAddModal) setShowAddModal(false);
        else if (editingItem) setEditingItem(null);
        else if (showCategoryModal) setShowCategoryModal(false);
        else if (showQRModal) setShowQRModal(false);
      }
    };
    if (showAddModal || editingItem || showCategoryModal || showQRModal) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showAddModal, editingItem, showCategoryModal, showQRModal]);

  // Helper: Upload image to Supabase Storage
  async function uploadImage(file: File): Promise<string | null> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `menu/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("menu-images")
      .getPublicUrl(filePath);

    return publicUrl;
  }

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);
  const vendorKey = selectedVendor ? getVendorKey(selectedVendor.type) : "food";
  const vendorType = selectedVendor?.type || "food";
  const table = TABLE_MAP[vendorKey];
  const categories = vendorCategories.length > 0 ? vendorCategories : CATEGORIES[vendorKey];

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

  useEffect(() => {
    const vendor = vendors.find(v => v.id === selectedVendorId);
    if (vendor?.categories && Array.isArray(vendor.categories) && vendor.categories.length > 0) {
      setVendorCategories(vendor.categories);
    } else {
      const key = vendor ? getVendorKey(vendor.type) : "food";
      setVendorCategories(CATEGORIES[key]);
    }
  }, [selectedVendorId, vendors]);

  async function loadVendors() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let { data } = await supabase
      .from("vendors")
      .select("id, shop_name, type")
      .eq("user_id", user.id)
      .order("shop_name");
    
    if (!data || data.length === 0) {
      const { data: fallbackData } = await supabase
        .from("vendors")
        .select("id, shop_name, type")
        .eq("email", user.email)
        .order("shop_name");
      if (fallbackData) data = fallbackData;
    }
    
    if (data) {
      setVendors(data);
      if (data.length > 0 && !selectedVendorId) {
        setSelectedVendorId(data[0].id);
      }
    }
  }

  async function loadItems() {
    setLoading(true);
    const query = supabase.from(table).select("id, vendor_id, name, price, category, image_url, is_veg, is_available, is_featured, description, stock, requires_prescription, has_discount, discount_percent, menu_slot").eq("vendor_id", selectedVendorId).order("name");
    const { data } = await query;
    if (data) setItems(data);
    setLoading(false);
  }

  function resetNewItem() {
    setNewItem({
      name: "",
      price: "",
      category: categories[0] || "",
      description: "",
      is_veg: true,
      stock: "",
      requires_prescription: false,
      imageFiles: [],
      image_url: "",
      showUrlInput: false,
      has_discount: false,
      discount_percent: 20,
      is_featured: false,
    });
  }

  function buildInsertPayload() {
    const base: Record<string, string | number | boolean | string[] | null> = {
      name: newItem.name,
      price: parseFloat(newItem.price),
      category: newItem.category || categories[0],
      vendor_id: selectedVendorId,
    };
    if (newItem.image_url) base.image_url = newItem.image_url;
    if (vendorKey === "food") {
      if (newItem.description) base.description = newItem.description;
      base.is_veg = newItem.is_veg;
      base.stock = parseInt(newItem.stock) || 0;
      if (newItem.menu_slot) base.menu_slot = newItem.menu_slot;
      base.is_featured = !!newItem.is_featured;
      if (newItem.has_discount && newItem.discount_percent > 0) {
        const discount = newItem.discount_percent;
        base.discount_percent = discount;
        base.original_price = parseFloat(newItem.price);
        base.price = Math.round(parseFloat(newItem.price) * (1 - discount / 100) * 100) / 100;
      }
    } else if (vendorKey === "grocery") {
      base.stock = parseInt(newItem.stock) || 0;
      if (newItem.description) base.description = newItem.description;
    } else if (vendorKey === "pharmacy") {
      base.stock = parseInt(newItem.stock) || 0;
      base.requires_prescription = newItem.requires_prescription;
      if (newItem.description) base.description = newItem.description;
    } else if (vendorKey === "flowers") {
      if (newItem.description) base.description = newItem.description;
    }
    return base;
  }

  function buildUpdatePayload(item: AnyItem) {
    const base: Record<string, string | number | boolean | string[] | null | undefined> = {
      name: item.name,
      price: item.price,
      category: item.category,
    };
    if ("image_url" in item) base.image_url = (item as BaseItem).image_url;
    if ("images" in item) base.images = (item as MenuItem).images;
    if (vendorKey === "food") {
      const m = item as MenuItem;
      if (m.description) base.description = m.description;
      base.is_veg = m.is_veg;
      base.stock = m.stock ?? 0;
      if (m.menu_slot) base.menu_slot = m.menu_slot;
      base.is_featured = !!m.is_featured;
      if (m.discount_percent && m.discount_percent > 0) {
        base.discount_percent = m.discount_percent;
        base.original_price = m.original_price || m.price;
        base.price = Math.round((m.original_price || m.price) * (1 - m.discount_percent / 100) * 100) / 100;
      }
    } else if (vendorKey === "grocery") {
      const g = item as GroceryItem;
      base.stock = g.stock;
    } else if (vendorKey === "pharmacy") {
      const p = item as PharmacyItem;
      base.stock = p.stock;
      base.requires_prescription = p.requires_prescription;
    } else if (vendorKey === "flowers") {
      const f = item as FlowerItem;
      if (f.description) base.description = f.description;
    }
    return base;
  }

  async function saveCategories(newCats: string[]) {
    const { error } = await supabase
      .from("vendors")
      .update({ categories: newCats })
      .eq("id", selectedVendorId);
    if (error) {
      useToastStore.getState().addToast("Failed to save categories: " + error.message, "error");
      return;
    }
    setVendorCategories(newCats);
    setVendors(prev => prev.map(v => v.id === selectedVendorId ? { ...v, categories: newCats } : v));
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      useToastStore.getState().addToast("Please fill in item name and price", "error");
      return;
    }
    if (!selectedVendorId) {
      useToastStore.getState().addToast("No vendor selected. Please select a vendor first.", "error");
      return;
    }
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      if (newItem.imageFiles?.length > 0) {
        for (const file of newItem.imageFiles) {
          const url = await uploadImage(file);
          if (url) uploadedUrls.push(url);
        }
      }
      const payload = buildInsertPayload();
      if (uploadedUrls.length > 0) {
        payload.image_url = uploadedUrls[0];
        payload.images = uploadedUrls;
      }
      payload.category = payload.category || "General";
      const { error } = await supabase.from(table).insert(payload);
      if (error) throw error;
      setShowAddModal(false);
      resetNewItem();
      loadItems();
    } catch (error: unknown) {
      useToastStore.getState().addToast("Failed: " + (error instanceof Error ? error.message : String(error)), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    try {
      const base = buildUpdatePayload(editingItem);
      const { error } = await supabase.from(table).update(base).eq("id", editingItem.id);
      if (error) throw error;
      setEditingItem(null);
      loadItems();
    } catch (error: unknown) {
      useToastStore.getState().addToast("Failed: " + (error instanceof Error ? error.message : String(error)), "error");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!await confirm({ title: "Delete Item", message: "Delete this item?", variant: "danger" })) return;
    try {
      await supabase.from(table).delete().eq("id", id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (error: unknown) {
      useToastStore.getState().addToast("Failed: " + (error instanceof Error ? error.message : String(error)), "error");
    }
  };

  const toggleAvailability = async (item: AnyItem) => {
    if (!("available" in item)) return;
    const m = item as MenuItem;
    try {
      const { error } = await supabase.from(table).update({ available: !m.available }).eq("id", item.id);
      if (error) {
        console.warn("Toggle availability not supported:", error.message);
        return;
      }
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, available: !m.available } as AnyItem : i));
    } catch (error: unknown) {
      console.warn("Toggle availability failed:", error instanceof Error ? error.message : String(error));
    }
  };

  const toggleFeatured = async (item: AnyItem) => {
    const current = !!(item as MenuItem).is_featured;
    try {
      const { error } = await supabase.from(table).update({ is_featured: !current }).eq("id", item.id);
      if (error) {
        console.warn("Toggle featured not supported:", error.message);
        return;
      }
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_featured: !current } as AnyItem : i));
    } catch (error: unknown) {
      console.warn("Toggle featured failed:", error instanceof Error ? error.message : String(error));
    }
  };

  const handleStockChange = async (item: AnyItem, delta: number) => {
    const currentStock = ('stock' in item ? (item as GroceryItem | PharmacyItem | MenuItem).stock : 0) ?? 0;
    const newStock = currentStock + delta;
    if (newStock < 0) return;
    try {
      const { error } = await supabase.from(table).update({ stock: newStock }).eq("id", item.id);
      if (error) {
        console.warn("Stock update not supported:", error.message);
        return;
      }
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, stock: newStock } as AnyItem : i));
    } catch (error: unknown) {
      console.warn("Stock update failed:", error instanceof Error ? error.message : String(error));
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === "" ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const pageTitle = vendorKey === "food" ? "Menu Items" :
    vendorKey === "grocery" ? "Grocery Products" :
    vendorKey === "pharmacy" ? "Medicines" : "Flower Items";

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight">Menu & Inventory</h1>
          <p className="text-[var(--color-outline)] text-sm mt-1">{pageTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="px-4 py-2.5 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold bg-[var(--color-surface-container-lowest)]"
          >
            {vendors.map(v => (
              <option key={v.id} value={v.id}>
                {v.shop_name}{v.type ? ` (${v.type})` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!selectedVendorId) {
                useToastStore.getState().addToast("Cannot add item: No active vendor is selected or associated with your account.", "error");
                return;
              }
              resetNewItem();
              setShowAddModal(true);
            }}
            className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add {vendorKey === "food" ? "Item" : vendorKey === "grocery" ? "Product" : vendorKey === "pharmacy" ? "Medicine" : "Item"}
          </button>
          <button
            onClick={() => { setBulkMode(!bulkMode); setSelectedItems(new Set()); }}
            aria-pressed={bulkMode}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border transition-colors ${
              bulkMode ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]"
            }`}
          >
            <span className="material-symbols-outlined text-lg">select_all</span>
            Bulk Edit
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline-variant)] text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[var(--color-surface-subtle)]"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Manage Categories
        </button>
        {selectedVendorId && (
          <>
            <button
              onClick={() => setShowQRModal(true)}
              className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[var(--color-surface-subtle)]"
            >
              <span className="material-symbols-outlined text-lg">qr_code</span>
              QR Code
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[var(--color-surface-subtle)]"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              Print Menu
            </button>
          </>
        )}
      </div>

      {/* Menu Intelligence + Bulk Import */}
      {selectedVendorId && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Optimization Suggestions */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#fef7f8] to-white rounded-2xl border border-[#f5d0d6] p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[var(--color-primary)]">insights</span>
              <h3 className="font-extrabold text-[var(--color-on-surface)] text-sm">Menu Intelligence</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {(() => {
                const total = items.length;
                const noDesc = items.filter(i => !('description' in i) || !(i as MenuItem | FlowerItem).description).length;
                const outOfStock = items.filter(i => 'stock' in i && (i as GroceryItem | PharmacyItem | MenuItem).stock === 0).length;
                const noImg = items.filter(i => !i.image_url).length;
                const suggestions: string[] = [];
                if (noDesc > 0) suggestions.push(`Add descriptions to ${noDesc} item${noDesc > 1 ? 's' : ''} to boost conversion`);
                if (outOfStock > 0) suggestions.push(`${outOfStock} item${outOfStock > 1 ? 's are' : ' is'} out of stock — restock soon`);
                if (noImg > 0) suggestions.push(`Upload images for ${noImg} item${noImg > 1 ? 's' : ''} — items with images sell 30% more`);
                if (total < 10) suggestions.push(`Consider adding more items — menus with 15+ items get 2x more orders`);
                if (noImg === 0 && noDesc === 0 && outOfStock === 0 && total >= 10) suggestions.push(`Your menu looks great! Continue adding seasonal specials.`);
                return suggestions;
              })().map((s, i) => (
                <div key={i} className="bg-[var(--color-surface-container-lowest)] rounded-xl p-3 border border-[var(--color-border-subtle)] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[var(--color-primary)] text-lg shrink-0">lightbulb</span>
                  <span className="text-[var(--color-on-surface)]">{s}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Bulk Import Card */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-5 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-3xl text-[var(--color-outline-variant)] mb-2">file_upload</span>
            <p className="font-bold text-[var(--color-on-surface)] text-sm">Bulk Import Items</p>
            <p className="text-xs text-[var(--color-outline-variant)] mt-1 mb-3">CSV upload</p>
              <label className="cursor-pointer px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-xl hover:bg-[var(--color-primary-dim)]">
              Upload CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  const rows = text.split('\n').slice(1).filter(r => r.trim());
                  if (rows.length > 50) {
                    useToastStore.getState().addToast("Maximum 50 rows allowed per import", "error");
                    e.target.value = '';
                    return;
                  }
                  const cols = rows.map(r => {
                    const [name, price, category, description, stock, isVeg] = r.split(',').map(c => c.trim());
                    return { name, price, category, description, stock, is_veg: isVeg === 'veg' };
                  });
                  const errors: string[] = [];
                  for (let i = 0; i < cols.length; i++) {
                    const c = cols[i];
                    if (!c.name) { errors.push(`Row ${i + 1}: name is required`); continue; }
                    if (c.name.length > 100) errors.push(`Row ${i + 1}: name exceeds 100 characters`);
                    if (c.description && c.description.length > 500) errors.push(`Row ${i + 1}: description exceeds 500 characters`);
                    const priceNum = parseFloat(c.price);
                    if (!c.price || isNaN(priceNum) || priceNum <= 0) errors.push(`Row ${i + 1}: price must be a positive number`);
                  }
                  if (errors.length > 0) {
                    useToastStore.getState().addToast(errors.slice(0, 5).join("; ") + (errors.length > 5 ? ` ...and ${errors.length - 5} more` : ""), "error");
                    e.target.value = '';
                    return;
                  }
                  if (!await confirm({ title: "Bulk Import", message: `Import ${cols.length} items? This will add them to your menu.`, variant: "default" })) {
                    e.target.value = '';
                    return;
                  }
                  const table = TABLE_MAP[vendorKey];
                  const vendorId = selectedVendorId;
                  let imported = 0;
                  for (const c of cols) {
                    if (!c.name || !c.price) continue;
                    const payload: Record<string, string | number | boolean | null> = {
                      vendor_id: vendorId,
                      name: c.name,
                      price: parseFloat(c.price),
                      category: c.category || categories[0],
                      image_url: null,
                    };
                    if (vendorKey === 'food') {
                      payload.description = c.description || '';
                      payload.available = true;
                      payload.is_veg = c.is_veg;
                      payload.stock = parseInt(c.stock || '0', 10) || 0;
                    }
                    if (vendorKey === 'grocery' || vendorKey === 'pharmacy') {
                      payload.stock = parseInt(c.stock || '0', 10) || 0;
                    }
                    const { error } = await supabase.from(table).insert(payload);
                    if (!error) imported++;
                  }
                  useToastStore.getState().addToast(`Imported ${imported} of ${rows.length} items`, "success");
                  loadItems();
                  e.target.value = '';
                }}
              />
            </label>
            <button type="button" onClick={(e) => {
              e.preventDefault();
              const blob = new Blob([['name,price,category,description,stock,isVeg', 'Butter Chicken,350,Main Course,Creamy tomato gravy,50,veg', 'Naan,40,Breads,Tandoor baked,100,veg'].join('\n')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'menu_template.csv'; a.click();
              URL.revokeObjectURL(url);
            }} className="text-[10px] text-[var(--color-primary)] font-semibold mt-2 hover:underline">Download template</button>
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {bulkMode && selectedItems.size > 0 && (
        <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-bold text-[var(--color-on-surface)]">{selectedItems.size} selected</span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold bg-[var(--color-surface-container-lowest)]"
          >
            <option value="">Select action...</option>
            {vendorKey === "food" && (
              <>
                <option value="discount">Set Discount %</option>
                <option value="remove_discount">Remove Discount</option>
                <option value="menu_slot">Set Menu Slot</option>
              </>
            )}
            <option value="category">Change Category</option>
            <option value="price_percent">Adjust Price by %</option>
            <option value="price_fixed">Set Price (fixed)</option>
            <option value="stock">Set Stock</option>
          </select>
          {bulkAction && (
            <div className="flex items-center gap-2">
              {bulkAction === "menu_slot" ? (
                <select
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="px-3 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold bg-[var(--color-surface-container-lowest)]"
                >
                  <option value="all_day">All Day</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              ) : bulkAction === "category" ? (
                <select
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="px-3 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm font-bold bg-[var(--color-surface-container-lowest)]"
                >
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input
                  type="number"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  placeholder={bulkAction === "price_percent" ? "+/- %" : "Value"}
                  className="w-24 px-3 py-2 border border-[var(--color-border-subtle)] rounded-xl text-sm"
                />
              )}
              <button
                onClick={async () => {
                  if (!bulkAction || !bulkValue) return;
                  const currentItems = itemsRef.current;
                  const currentSelected = selectedItemsRef.current;
                  const updates: Record<string, string | number | null> = {};
                  if (bulkAction === "discount") {
                    updates.discount_percent = parseInt(bulkValue);
                  } else if (bulkAction === "remove_discount") {
                    updates.discount_percent = 0;
                    updates.original_price = null;
                  } else if (bulkAction === "menu_slot") {
                    updates.menu_slot = bulkValue;
                  } else if (bulkAction === "category") {
                    updates.category = bulkValue;
                  } else if (bulkAction === "price_percent") {
                    const pct = parseFloat(bulkValue);
                    const itemData = currentItems.filter(i => currentSelected.has(i.id));
                    for (const item of itemData) {
                      const newPrice = Math.round(item.price * (1 + pct / 100) * 100) / 100;
                      await supabase.from(table).update({ price: newPrice }).eq("id", item.id);
                    }
                    loadItems();
                    setSelectedItems(new Set());
                    setBulkAction("");
                    setBulkValue("");
                    return;
                  } else if (bulkAction === "price_fixed") {
                    updates.price = parseFloat(bulkValue);
                  } else if (bulkAction === "stock") {
                    updates.stock = parseInt(bulkValue);
                  }
                  const ids = Array.from(currentSelected);
                  const { error } = await supabase.from(table).update(updates).in("id", ids);
                  if (!error) {
                    loadItems();
                    setSelectedItems(new Set());
                    setBulkAction("");
                    setBulkValue("");
                  }
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white font-bold rounded-xl text-sm"
              >
                Apply
              </button>
            </div>
          )}
          <button
            onClick={() => { setSelectedItems(new Set()); setBulkAction(""); setBulkValue(""); }}
            className="px-4 py-2 border border-[var(--color-border-subtle)] text-[var(--color-outline)] font-bold rounded-xl text-sm hover:bg-[var(--color-surface-subtle)]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden">
        <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-[var(--color-outline-variant)] font-medium">Loading items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60 mb-3">
              {vendorKey === "grocery" ? "shopping_cart" : vendorKey === "pharmacy" ? "medication" : vendorKey === "flowers" ? "local_florist" : "restaurant_menu"}
            </span>
            <p className="text-[var(--color-outline-variant)] font-medium">No {pageTitle.toLowerCase()} found</p>
            <button
              onClick={() => { resetNewItem(); setShowAddModal(true); }}
              className="mt-4 text-[var(--color-primary)] font-bold text-sm hover:underline"
            >
              Add your first {vendorKey === "pharmacy" ? "medicine" : vendorKey === "grocery" ? "product" : "item"}
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <caption className="sr-only">Menu items inventory</caption>
            <thead className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-border-subtle)]">
              <tr>
                {bulkMode && (
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onChange={() => {
                        if (selectedItems.size === filteredItems.length) {
                          setSelectedItems(new Set());
                        } else {
                          setSelectedItems(new Set(filteredItems.map(i => i.id)));
                        }
                      }}
                      className="w-4 h-4 accent-[var(--color-primary)]"
                    />
                  </th>
                )}
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Item</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Category</th>
                {vendorKey === "food" && (
                  <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Type</th>
                )}
                {(vendorKey === "food" || vendorKey === "grocery" || vendorKey === "pharmacy") && (
                  <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Stock</th>
                )}
                {vendorKey === "pharmacy" && (
                  <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Rx</th>
                )}
                {vendorKey === "food" && (
                  <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Status</th>
                )}
                {vendorKey === "food" && (
                  <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest">Featured</th>
                )}
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest text-right">Price</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filteredItems.map((item) => (
                <tr key={item.id} className={`hover:bg-[var(--color-surface-subtle)] transition-colors ${selectedItems.has(item.id) ? "bg-[var(--color-primary)]/5" : ""}`}>
                  {bulkMode && (
                    <td className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => {
                          const next = new Set(selectedItems);
                          if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                          setSelectedItems(next);
                        }}
                        className="w-4 h-4 accent-[var(--color-primary)]"
                      />
                    </td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--color-surface-container)] rounded-xl flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <BlurImage
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        <span className="mi-fallback material-symbols-outlined text-[var(--color-outline-variant)]" style={{ display: item.image_url ? "none" : "flex" }}>
                          {vendorKey === "grocery" ? "shopping_cart" : vendorKey === "pharmacy" ? "medication" : vendorKey === "flowers" ? "local_florist" : "restaurant"}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-on-surface)]">{item.name}</p>
                        {'description' in item && (item as MenuItem | FlowerItem).description && (
                          <p className="text-xs text-[var(--color-outline-variant)] mt-0.5">{(item as MenuItem | FlowerItem).description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold text-[var(--color-outline)]">{item.category}</span>
                  </td>
                  {vendorKey === "food" && (
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${(item as MenuItem).is_veg ? 'text-green-600' : 'text-red-600'}`}>
                        <span className={`w-2 h-2 rounded-sm ${(item as MenuItem).is_veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {(item as MenuItem).is_veg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>
                  )}
                  {(vendorKey === "food" || vendorKey === "grocery" || vendorKey === "pharmacy") && (
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {'stock' in item && (
                          <>
                            <button
                              onClick={() => handleStockChange(item, -1)}
                              aria-label="Decrease stock"
                              className="w-11 h-11 bg-[var(--color-surface-container)] rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-container-high)] text-sm font-bold"
                            >−</button>
                            <span className={`text-sm font-bold min-w-[2ch] text-center ${('stock' in item && (item as GroceryItem | PharmacyItem | MenuItem).stock === 0) ? 'text-red-600' : ('stock' in item && (item as GroceryItem | PharmacyItem | MenuItem).stock! < 10) ? 'text-amber-600' : 'text-[var(--color-on-surface)]'}`}>
                              {'stock' in item ? (item as GroceryItem | PharmacyItem | MenuItem).stock : 0}
                            </span>
                            <button
                              onClick={() => handleStockChange(item, 1)}
                              aria-label="Increase stock"
                              className="w-11 h-11 bg-[var(--color-surface-container)] rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-container-high)] text-sm font-bold"
                            >+</button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                  {vendorKey === "pharmacy" && (
                    <td className="p-4">
                      {(item as PharmacyItem).requires_prescription && (
                        <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full uppercase">Rx</span>
                      )}
                    </td>
                  )}
                  {vendorKey === "food" && (
                    <td className="p-4">
                      <button
                        onClick={() => toggleAvailability(item)}
                        role="switch"
                        aria-checked={(item as MenuItem).available}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          (item as MenuItem).available
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {(item as MenuItem).available ? "Available" : "Unavailable"}
                      </button>
                    </td>
                  )}
                  {vendorKey === "food" && (
                    <td className="p-4">
                      <button
                        onClick={() => toggleFeatured(item)}
                        role="switch"
                        aria-checked={!!(item as MenuItem).is_featured}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          (item as MenuItem).is_featured
                            ? "bg-amber-100 text-amber-700"
                            : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"
                        }`}
                      >
                        {(item as MenuItem).is_featured ? "Featured" : "Promote"}
                      </button>
                    </td>
                  )}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(item as MenuItem).discount_percent != null && (item as MenuItem).discount_percent! > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">-{(item as MenuItem).discount_percent}%</span>
                      )}
                      <p className="font-extrabold text-[var(--color-on-surface)]">
                        {(item as MenuItem).original_price ? (
                          <>
                            <span className="line-through text-[var(--color-outline-variant)] text-xs mr-1">₹{(item as MenuItem).original_price}</span>
                            ₹{item.price}
                          </>
                        ) : (
                          <>₹{item.price}</>
                        )}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="w-10 h-10 bg-[var(--color-surface-container)] rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-container-high)] transition-colors"
                        aria-label={`Edit ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-10 h-10 bg-[var(--color-surface-container)] rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                        aria-label={`Delete ${item.name}`}
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
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)} role="dialog" aria-modal="true" aria-labelledby="add-item-title">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-3xl p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 id="add-item-title" className="text-xl font-extrabold text-[var(--color-on-surface)]">
                Add {vendorKey === "food" ? "Menu Item" : vendorKey === "grocery" ? "Product" : vendorKey === "pharmacy" ? "Medicine" : "Item"}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="add-item-name" className="text-sm font-semibold text-[var(--color-on-surface)]">Name *</label>
                <input
                  id="add-item-name"
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder={vendorKey === "food" ? "e.g., Butter Chicken" : vendorKey === "grocery" ? "e.g., Organic Apples" : vendorKey === "pharmacy" ? "e.g., Paracetamol" : "e.g., Rose Bouquet"}
                  className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label htmlFor="add-item-price" className="text-sm font-semibold text-[var(--color-on-surface)]">Price (₹) *</label>
                <input
                  id="add-item-price"
                  type="number"
                  min="0"
                  step="0.5"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="e.g., 280"
                  className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label htmlFor="add-item-category" className="text-sm font-semibold text-[var(--color-on-surface)]">Category</label>
                <select
                  id="add-item-category"
                  value={newItem.category || categories[0]}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {(vendorKey === "food" || vendorKey === "flowers") && (
                <div>
                  <label htmlFor="add-item-description" className="text-sm font-semibold text-[var(--color-on-surface)]">Description</label>
                  <textarea
                    id="add-item-description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Brief description"
                    rows={2}
                    className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                  />
                </div>
              )}
              {(vendorKey === "grocery" || vendorKey === "pharmacy") && (
                <div>
                  <label htmlFor="add-item-stock" className="text-sm font-semibold text-[var(--color-on-surface)]">Stock Quantity</label>
                  <input
                    id="add-item-stock"
                    type="number"
                    min="0"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                    placeholder="e.g., 100"
                    className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              )}
              {(vendorKey === "food") && (
                <div>
                  <label htmlFor="add-item-stock-food" className="text-sm font-semibold text-[var(--color-on-surface)]">Stock Quantity</label>
                  <input
                    id="add-item-stock-food"
                    type="number"
                    min="0"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                    placeholder="e.g., 50"
                    className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              )}
              {vendorKey === "food" && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={newItem.has_discount}
                      onChange={(e) => setNewItem({ ...newItem, has_discount: e.target.checked })}
                      className="w-5 h-5 accent-[var(--color-primary)]"
                    />
                    <span className="text-sm font-bold text-red-700">Put on Sale</span>
                  </label>
                  {newItem.has_discount && (
                    <div>
                      <label htmlFor="add-item-discount" className="text-xs font-semibold text-[var(--color-on-surface)] mb-2 block">Discount %</label>
                      <div className="flex gap-2">
                        {[10, 15, 20, 25, 30, 40, 50].map((p) => (
                          <button
                            key={p}
                            onClick={() => setNewItem({ ...newItem, discount_percent: p })}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                              newItem.discount_percent === p
                                ? "bg-[var(--color-primary)] text-white shadow-md"
                                : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]"
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                      {newItem.price && (
                        <p className="text-xs text-[var(--color-outline)] mt-2">
                          Original: ₹{parseFloat(newItem.price).toFixed(2)} →{" "}
                          <span className="font-bold text-red-600">
                            ₹{(parseFloat(newItem.price) * (1 - newItem.discount_percent / 100)).toFixed(2)}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {vendorKey === "food" && (
                <div>
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Type</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={newItem.is_veg}
                        onChange={() => setNewItem({ ...newItem, is_veg: true })}
                        className="accent-[var(--color-primary)]"
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
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="flex items-center gap-1 text-sm font-medium text-red-700">
                        <span className="w-3 h-3 bg-red-500 rounded-sm"></span> Non-Veg
                      </span>
                    </label>
                  </div>
                </div>
              )}
              {vendorKey === "food" && (
                <div>
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Available For</label>
                  <select
                    value={newItem.menu_slot || "all_day"}
                    onChange={(e) => setNewItem({ ...newItem, menu_slot: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="all_day">All Day</option>
                    <option value="breakfast">Breakfast (6 AM – 11 AM)</option>
                    <option value="lunch">Lunch (11 AM – 4 PM)</option>
                    <option value="dinner">Dinner (4 PM – 11 PM)</option>
                  </select>
                </div>
              )}
              {vendorKey === "food" && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newItem.is_featured}
                      onChange={(e) => setNewItem({ ...newItem, is_featured: e.target.checked })}
                      className="w-5 h-5 accent-[var(--color-primary)]"
                    />
                    <span className="text-sm font-bold text-amber-700">Promote as Featured</span>
                  </label>
                  <p className="text-xs text-amber-600 mt-2 ml-8">Featured items appear first on your menu with a special badge</p>
                </div>
              )}
              {vendorKey === "pharmacy" && (
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newItem.requires_prescription}
                      onChange={(e) => setNewItem({ ...newItem, requires_prescription: e.target.checked })}
                      className="w-5 h-5 accent-[var(--color-primary)]"
                    />
                    <span className="text-sm font-semibold text-[var(--color-on-surface)]">Requires Prescription</span>
                  </label>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles = files.filter((file: File) => {
                      if (!file.type.startsWith("image/")) {
                        useToastStore.getState().addToast("Only image files are allowed", "error");
                        return false;
                      }
                      return true;
                    });
                    if (validFiles.length > 0) {
                      setNewItem({ ...newItem, imageFiles: [...(newItem.imageFiles || []), ...validFiles] });
                    }
                    e.target.value = "";
                  }}
                  className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--color-primary)] file:text-white file:font-bold file:text-xs hover:file:bg-[#a40017]"
                />
                {newItem.imageFiles?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newItem.imageFiles.map((file: File, idx: number) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--color-border-subtle)] group">
                        <BlurImage src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setNewItem({
                            ...newItem,
                            imageFiles: newItem.imageFiles.filter((_: File, i: number) => i !== idx)
                          })}
                          className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-xl"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setNewItem({ ...newItem, showUrlInput: !newItem.showUrlInput })}
                    className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                  >
                    {newItem.showUrlInput ? "Hide URL input" : "Or enter image URL instead"}
                  </button>
                  {newItem.showUrlInput && (
                    <input
                      type="url"
                      value={newItem.image_url}
                      onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value, imageFiles: [] })}
                      placeholder="https://example.com/image.jpg"
                      className="mt-2 w-full px-4 py-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  )}
                </div>
              </div>
              <button
                onClick={handleAddItem}
                disabled={uploading}
                className="w-full py-4 bg-[var(--color-primary)] text-white font-extrabold rounded-2xl mt-4 hover:bg-[var(--color-primary-dim)] transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : `Add ${vendorKey === "pharmacy" ? "Medicine" : vendorKey === "grocery" ? "Product" : "Item"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingItem(null)} role="dialog" aria-modal="true" aria-labelledby="edit-item-title">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-3xl p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 id="edit-item-title" className="text-xl font-extrabold text-[var(--color-on-surface)]">Edit Item</h2>
              <button onClick={() => setEditingItem(null)} className="w-10 h-10 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-item-name" className="text-sm font-semibold text-[var(--color-on-surface)]">Name</label>
                <input
                  id="edit-item-name"
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label htmlFor="edit-item-price" className="text-sm font-semibold text-[var(--color-on-surface)]">Price (₹)</label>
                <input
                  id="edit-item-price"
                  type="number"
                  min="0"
                  step="0.5"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                  className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label htmlFor="edit-item-category" className="text-sm font-semibold text-[var(--color-on-surface)]">Category</label>
                <select
                  id="edit-item-category"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {(vendorKey === "food" || vendorKey === "flowers") && (
                <div>
                  <label htmlFor="edit-item-description" className="text-sm font-semibold text-[var(--color-on-surface)]">Description</label>
                  <textarea
                    id="edit-item-description"
                    value={(editingItem as MenuItem).description || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    rows={2}
                    className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
                  />
                </div>
              )}
              {(vendorKey === "food" || vendorKey === "grocery" || vendorKey === "pharmacy") && (
                <div>
                  <label htmlFor="edit-item-stock" className="text-sm font-semibold text-[var(--color-on-surface)]">Stock Quantity</label>
                  <input
                    id="edit-item-stock"
                    type="number"
                    min="0"
                    value={'stock' in editingItem ? (editingItem as GroceryItem | PharmacyItem | MenuItem).stock ?? 0 : 0}
                    onChange={(e) => setEditingItem({ ...editingItem, stock: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              )}
              {vendorKey === "food" && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={(editingItem as MenuItem).discount_percent != null && (editingItem as MenuItem).discount_percent! > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingItem({ ...editingItem, discount_percent: 20, original_price: editingItem.price } as AnyItem);
                        } else {
                          setEditingItem({ ...editingItem, discount_percent: 0 } as AnyItem);
                        }
                      }}
                      className="w-5 h-5 accent-[var(--color-primary)]"
                    />
                    <span className="text-sm font-bold text-red-700">On Sale</span>
                  </label>
                  {(editingItem as MenuItem).discount_percent != null && (editingItem as MenuItem).discount_percent! > 0 && (
                    <div>
                      <label htmlFor="edit-item-discount" className="text-xs font-semibold text-[var(--color-on-surface)] mb-2 block">Discount %</label>
                      <div className="flex gap-2">
                        {[10, 15, 20, 25, 30, 40, 50].map((p) => (
                          <button
                            key={p}
                            onClick={() => setEditingItem({ ...editingItem, discount_percent: p } as AnyItem)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                              (editingItem as MenuItem).discount_percent === p
                                ? "bg-[var(--color-primary)] text-white shadow-md"
                                : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-subtle)]"
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-[var(--color-outline)] mt-2">
                        Original: ₹{((editingItem as MenuItem).original_price || editingItem.price).toFixed(2)} →{" "}
                        <span className="font-bold text-red-600">
                          ₹{Math.round(((editingItem as MenuItem).original_price || editingItem.price) * (1 - ((editingItem as MenuItem).discount_percent || 0) / 100) * 100) / 100}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
              {vendorKey === "food" && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!(editingItem as MenuItem).is_featured}
                      onChange={(e) => setEditingItem({ ...editingItem, is_featured: e.target.checked } as AnyItem)}
                      className="w-5 h-5 accent-[var(--color-primary)]"
                    />
                    <span className="text-sm font-bold text-amber-700">Promote as Featured</span>
                  </label>
                  <p className="text-xs text-amber-600 mt-2 ml-8">Featured items appear first on your menu</p>
                </div>
              )}
              {vendorKey === "food" && (
                <div>
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Type</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={(editingItem as MenuItem).is_veg}
                        onChange={() => setEditingItem({ ...editingItem, is_veg: true })}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="flex items-center gap-1 text-sm font-medium text-green-700">
                        <span className="w-3 h-3 bg-green-500 rounded-sm"></span> Veg
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!(editingItem as MenuItem).is_veg}
                        onChange={() => setEditingItem({ ...editingItem, is_veg: false })}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="flex items-center gap-1 text-sm font-medium text-red-700">
                        <span className="w-3 h-3 bg-red-500 rounded-sm"></span> Non-Veg
                      </span>
                    </label>
                  </div>
                </div>
              )}
              {vendorKey === "food" && (
                <div>
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Available For</label>
                  <select
                    value={(editingItem as MenuItem).menu_slot || "all_day"}
                    onChange={(e) => setEditingItem({ ...editingItem, menu_slot: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="all_day">All Day</option>
                    <option value="breakfast">Breakfast (6 AM – 11 AM)</option>
                    <option value="lunch">Lunch (11 AM – 4 PM)</option>
                    <option value="dinner">Dinner (4 PM – 11 PM)</option>
                  </select>
                </div>
              )}
              {vendorKey === "pharmacy" && (
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(editingItem as PharmacyItem).requires_prescription}
                      onChange={(e) => setEditingItem({ ...editingItem, requires_prescription: e.target.checked })}
                      className="w-5 h-5 accent-[var(--color-primary)]"
                    />
                    <span className="text-sm font-semibold text-[var(--color-on-surface)]">Requires Prescription</span>
                  </label>
                </div>
              )}
              {editingItem && (("images" in editingItem && (editingItem as MenuItem).images && (editingItem as MenuItem).images!.length > 0) || ("image_url" in editingItem && (editingItem as MenuItem).image_url)) && (
                <div>
                  <label className="text-sm font-semibold text-[var(--color-on-surface)] block mb-2">Current Images</label>
                  <div className="flex flex-wrap gap-2">
                    {(("images" in editingItem && (editingItem as MenuItem).images && (editingItem as MenuItem).images!.length > 0 ? (editingItem as MenuItem).images! : [("image_url" in editingItem ? (editingItem as MenuItem).image_url : "")])).filter((url): url is string => !!url).map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[var(--color-border-subtle)] group">
                        <BlurImage src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            const existing: string[] = ("images" in editingItem && (editingItem as MenuItem).images ? (editingItem as MenuItem).images! : ("image_url" in editingItem ? [(editingItem as MenuItem).image_url!] : []));
                            const imgs = existing.filter((_url, i) => i !== idx);
                            setEditingItem({ ...editingItem, images: imgs, image_url: imgs[0] || null } as AnyItem);
                          }}
                          className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-xl"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Add Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles = files.filter((file: File) => {
                      if (!file.type.startsWith("image/")) {
                        useToastStore.getState().addToast("Only image files are allowed", "error");
                        return false;
                      }
                      return true;
                    });
                    const newUrls: string[] = [];
                    for (const file of validFiles) {
                      setUploading(true);
                      const url = await uploadImage(file);
                      if (url) newUrls.push(url);
                      setUploading(false);
                    }
                    if (newUrls.length > 0) {
                      const existing: string[] = ("images" in editingItem && (editingItem as MenuItem).images ? (editingItem as MenuItem).images! : (("image_url" in editingItem && (editingItem as MenuItem).image_url) ? [(editingItem as MenuItem).image_url!] : []));
                      const all = [...existing, ...newUrls];
                      setEditingItem({ ...editingItem, images: all, image_url: all[0] } as AnyItem);
                    }
                    e.target.value = "";
                  }}
                  className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--color-primary)] file:text-white file:font-bold file:text-xs hover:file:bg-[#a40017]"
                />
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditUrlInput(!showEditUrlInput)}
                    className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                  >
                    {showEditUrlInput ? "Hide URL input" : "Or enter URL instead"}
                  </button>
                  {showEditUrlInput && (
                    <input
                      type="url"
                      value={("image_url" in editingItem ? (editingItem as MenuItem).image_url : "") || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value } as AnyItem)}
                      placeholder="https://example.com/image.jpg"
                      className="mt-2 w-full px-4 py-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-4 border border-[var(--color-border-subtle)] text-[var(--color-on-surface-variant)] font-bold rounded-2xl hover:bg-[var(--color-surface-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateItem}
                  disabled={uploading}
                  className="flex-1 py-4 bg-[var(--color-primary)] text-white font-extrabold rounded-2xl hover:bg-[var(--color-primary-dim)] transition-colors disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCategoryModal(false)} role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-3xl p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 id="category-modal-title" className="text-xl font-extrabold text-[var(--color-on-surface)]">Manage Categories</h2>
              <button onClick={() => setShowCategoryModal(false)} className="w-10 h-10 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 mb-6">
              {vendorCategories.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {editingCategory?.oldName === cat ? (
                    <input
                      type="text"
                      value={editingCategory.newName}
                      onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editingCategory.newName.trim()) {
                          const updated = vendorCategories.map(c => c === cat ? editingCategory.newName.trim() : c);
                          saveCategories(updated);
                          setEditingCategory(null);
                        }
                        if (e.key === "Escape") setEditingCategory(null);
                      }}
                      className="flex-1 px-3 py-2 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 px-3 py-2 text-sm font-medium">{cat}</span>
                  )}
                  {editingCategory?.oldName !== cat && (
                    <>
                      <button
                        onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                        className="p-2 hover:bg-[var(--color-surface-container)] rounded-lg"
                        aria-label={`Edit ${cat}`}
                      >
                        <span className="material-symbols-outlined text-lg text-[var(--color-outline)]">edit</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirm({ title: "Delete Category", message: `Delete category "${cat}"? Items in this category won't be deleted.`, variant: "danger" })) {
                            saveCategories(vendorCategories.filter(c => c !== cat));
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg"
                        aria-label={`Delete ${cat}`}
                      >
                        <span className="material-symbols-outlined text-lg text-red-400">delete</span>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-[var(--color-border-subtle)] pt-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCategoryName.trim()) {
                    saveCategories([...vendorCategories, newCategoryName.trim()]);
                    setNewCategoryName("");
                  }
                }}
                placeholder="New category name..."
                className="flex-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
              <button
                onClick={() => {
                  if (newCategoryName.trim()) {
                    saveCategories([...vendorCategories, newCategoryName.trim()]);
                    setNewCategoryName("");
                  }
                }}
                className="px-5 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl text-sm hover:bg-[var(--color-primary-dim)]"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowQRModal(false)} role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
          <div id="qr-modal" className="bg-[var(--color-surface-container-lowest)] w-full max-w-sm rounded-3xl p-8 m-4 text-center" onClick={e => e.stopPropagation()}>
            <span className="material-symbols-outlined text-6xl text-[var(--color-on-surface)] mb-4">qr_code_scanner</span>
            <h2 id="qr-modal-title" className="text-xl font-extrabold text-[var(--color-on-surface)] mb-2">Menu QR Code</h2>
            <p className="text-sm text-[var(--color-outline)] mb-6">Scan to view {selectedVendor?.shop_name || "store"}'s menu</p>
            {selectedVendorId && (
              <BlurImage
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/app/vendor/${selectedVendorId}`)}`}
                alt="Menu QR Code"
                className="w-48 h-48 mx-auto mb-6"
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-3 border border-[var(--color-border-subtle)] text-[var(--color-on-surface-variant)] font-bold rounded-xl text-sm hover:bg-[var(--color-surface-subtle)]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.download = `${selectedVendor?.shop_name || "menu"}-qr.png`;
                  const qr = document.querySelector("#qr-modal img") as HTMLImageElement;
                  if (qr) link.href = qr.src;
                  link.click();
                }}
                className="flex-1 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl text-sm hover:bg-[var(--color-primary-dim)]"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
