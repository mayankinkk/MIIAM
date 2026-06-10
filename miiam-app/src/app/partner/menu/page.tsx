"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorForUser } from "@/lib/vendor";

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
  stock?: number;
  original_price?: number | null;
  discount_percent?: number | null;
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
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [items, setItems] = useState<AnyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AnyItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [newItem, setNewItem] = useState<Record<string, any>>({
    name: "",
    price: "",
    category: "",
    description: "",
    is_veg: true,
    stock: "",
    requires_prescription: false,
    imageFiles: [] as File[],
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
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkValue, setBulkValue] = useState<string>("");
  const itemsRef = useRef(items);
  const selectedItemsRef = useRef(selectedItems);
  itemsRef.current = items;
  selectedItemsRef.current = selectedItems;

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

    const { data, error } = await supabase
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
    const query = supabase.from(table).select("*").eq("vendor_id", selectedVendorId).order("name");
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
    const base: Record<string, any> = {
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
        const discount = parseFloat(newItem.discount_percent);
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
    const base: Record<string, any> = {
      name: item.name,
      price: item.price,
      category: item.category,
    };
    if ((item as any).image_url) base.image_url = (item as any).image_url;
    if ((item as any).images) base.images = (item as any).images;
    if (vendorKey === "food") {
      const m = item as MenuItem;
      if (m.description) base.description = m.description;
      base.is_veg = m.is_veg;
      base.stock = (m as any).stock ?? 0;
      if ((m as any).menu_slot) base.menu_slot = (m as any).menu_slot;
      base.is_featured = !!(m as any).is_featured;
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
      alert("Failed to save categories: " + error.message);
      return;
    }
    setVendorCategories(newCats);
    setVendors(prev => prev.map(v => v.id === selectedVendorId ? { ...v, categories: newCats } : v));
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      alert("Please fill in item name and price");
      return;
    }
    if (!selectedVendorId) {
      alert("No vendor selected. Please select a vendor first.");
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
    } catch (error: any) {
      alert("Failed: " + error.message);
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
    } catch (error: any) {
      alert("Failed: " + error.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await supabase.from(table).delete().eq("id", id);
      setItems(items.filter(i => i.id !== id));
    } catch (error: any) {
      alert("Failed: " + error.message);
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
      setItems(items.map(i => i.id === item.id ? { ...i, available: !m.available } as AnyItem : i));
    } catch (error: any) {
      console.warn("Toggle availability failed:", error.message);
    }
  };

  const toggleFeatured = async (item: AnyItem) => {
    const current = !!(item as any).is_featured;
    try {
      const { error } = await supabase.from(table).update({ is_featured: !current }).eq("id", item.id);
      if (error) {
        console.warn("Toggle featured not supported:", error.message);
        return;
      }
      setItems(items.map(i => i.id === item.id ? { ...i, is_featured: !current } as any : i));
    } catch (error: any) {
      console.warn("Toggle featured failed:", error.message);
    }
  };

  const handleStockChange = async (item: AnyItem, delta: number) => {
    const currentStock = (item as any).stock ?? 0;
    const newStock = currentStock + delta;
    if (newStock < 0) return;
    try {
      const { error } = await supabase.from(table).update({ stock: newStock }).eq("id", item.id);
      if (error) {
        console.warn("Stock update not supported:", error.message);
        return;
      }
      setItems(items.map(i => i.id === item.id ? { ...i, stock: newStock } as AnyItem : i));
    } catch (error: any) {
      console.warn("Stock update failed:", error.message);
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Menu & Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">{pageTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold bg-white"
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
                alert("Cannot add item: No active vendor is selected or associated with your account.");
                return;
              }
              resetNewItem();
              setShowAddModal(true);
            }}
            className="bg-[#ba001c] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add {vendorKey === "food" ? "Item" : vendorKey === "grocery" ? "Product" : vendorKey === "pharmacy" ? "Medicine" : "Item"}
          </button>
          <button
            onClick={() => { setBulkMode(!bulkMode); setSelectedItems(new Set()); }}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border transition-colors ${
              bulkMode ? "bg-[#ba001c] text-white border-[#ba001c]" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="material-symbols-outlined text-lg">select_all</span>
            Bulk Edit
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
        <button
          onClick={() => setShowCategoryModal(true)}
          className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Manage Categories
        </button>
        {selectedVendorId && (
          <>
            <button
              onClick={() => setShowQRModal(true)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-lg">qr_code</span>
              QR Code
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50"
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
              <span className="material-symbols-outlined text-[#ba001c]">insights</span>
              <h3 className="font-extrabold text-slate-900 text-sm">Menu Intelligence</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {(() => {
                const total = items.length;
                const noDesc = items.filter(i => !('description' in i) || !(i as any).description).length;
                const outOfStock = items.filter(i => 'stock' in i && (i as any).stock === 0).length;
                const noImg = items.filter(i => !i.image_url).length;
                const suggestions: string[] = [];
                if (noDesc > 0) suggestions.push(`Add descriptions to ${noDesc} item${noDesc > 1 ? 's' : ''} to boost conversion`);
                if (outOfStock > 0) suggestions.push(`${outOfStock} item${outOfStock > 1 ? 's are' : ' is'} out of stock — restock soon`);
                if (noImg > 0) suggestions.push(`Upload images for ${noImg} item${noImg > 1 ? 's' : ''} — items with images sell 30% more`);
                if (total < 10) suggestions.push(`Consider adding more items — menus with 15+ items get 2x more orders`);
                if (noImg === 0 && noDesc === 0 && outOfStock === 0 && total >= 10) suggestions.push(`Your menu looks great! Continue adding seasonal specials.`);
                return suggestions;
              })().map((s, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-slate-100 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#ba001c] text-lg shrink-0">lightbulb</span>
                  <span className="text-slate-700">{s}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Bulk Import Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">file_upload</span>
            <p className="font-bold text-slate-800 text-sm">Bulk Import Items</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">CSV upload</p>
            <label className="cursor-pointer px-4 py-2 bg-[#ba001c] text-white text-xs font-bold rounded-xl hover:bg-[#a40017]">
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
                  const cols = rows.map(r => {
                    const [name, price, category, description, stock, isVeg] = r.split(',').map(c => c.trim());
                    return { name, price, category, description, stock, is_veg: isVeg === 'veg' };
                  });
                  const table = TABLE_MAP[vendorKey];
                  const vendorId = selectedVendorId;
                  let imported = 0;
                  for (const c of cols) {
                    if (!c.name || !c.price) continue;
                    const payload: any = {
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
                  alert(`Imported ${imported} of ${rows.length} items`);
                  loadItems();
                  e.target.value = '';
                }}
              />
            </label>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              const blob = new Blob([['name,price,category,description,stock,isVeg', 'Butter Chicken,350,Main Course,Creamy tomato gravy,50,veg', 'Naan,40,Breads,Tandoor baked,100,veg'].join('\n')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'menu_template.csv'; a.click();
              URL.revokeObjectURL(url);
            }} className="text-[10px] text-[#ba001c] font-semibold mt-2 hover:underline">Download template</a>
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {bulkMode && selectedItems.size > 0 && (
        <div className="bg-[#ba001c]/5 border border-[#ba001c]/20 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-bold text-slate-700">{selectedItems.size} selected</span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white"
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
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white"
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
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white"
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
                  className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              )}
              <button
                onClick={async () => {
                  if (!bulkAction || !bulkValue) return;
                  const currentItems = itemsRef.current;
                  const currentSelected = selectedItemsRef.current;
                  const updates: Record<string, any> = {};
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
                className="px-4 py-2 bg-[#ba001c] text-white font-bold rounded-xl text-sm"
              >
                Apply
              </button>
            </div>
          )}
          <button
            onClick={() => { setSelectedItems(new Set()); setBulkAction(""); setBulkValue(""); }}
            className="px-4 py-2 border border-slate-200 text-slate-500 font-bold rounded-xl text-sm hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">
              {vendorKey === "grocery" ? "shopping_cart" : vendorKey === "pharmacy" ? "medication" : vendorKey === "flowers" ? "local_florist" : "restaurant_menu"}
            </span>
            <p className="text-slate-400 font-medium">No {pageTitle.toLowerCase()} found</p>
            <button
              onClick={() => { resetNewItem(); setShowAddModal(true); }}
              className="mt-4 text-[#ba001c] font-bold text-sm hover:underline"
            >
              Add your first {vendorKey === "pharmacy" ? "medicine" : vendorKey === "grocery" ? "product" : "item"}
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
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
                      className="w-4 h-4 accent-[#ba001c]"
                    />
                  </th>
                )}
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                {vendorKey === "food" && (
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                )}
                {(vendorKey === "food" || vendorKey === "grocery" || vendorKey === "pharmacy") && (
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</th>
                )}
                {vendorKey === "pharmacy" && (
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rx</th>
                )}
                {vendorKey === "food" && (
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                )}
                {vendorKey === "food" && (
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Featured</th>
                )}
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${selectedItems.has(item.id) ? "bg-[#ba001c]/5" : ""}`}>
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
                        className="w-4 h-4 accent-[#ba001c]"
                      />
                    </td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const el = e.currentTarget.parentElement?.querySelector(".mi-fallback");
                              if (el) (el as HTMLElement).style.display = "flex";
                            }}
                          />
                        ) : null}
                        <span className="mi-fallback material-symbols-outlined text-slate-400" style={{ display: item.image_url ? "none" : "flex" }}>
                          {vendorKey === "grocery" ? "shopping_cart" : vendorKey === "pharmacy" ? "medication" : vendorKey === "flowers" ? "local_florist" : "restaurant"}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        {'description' in item && (item as any).description && (
                          <p className="text-xs text-slate-400 mt-0.5">{(item as any).description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold text-slate-500">{item.category}</span>
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
                              className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 text-sm font-bold"
                            >−</button>
                            <span className={`text-sm font-bold min-w-[2ch] text-center ${(item as any).stock === 0 ? 'text-red-600' : (item as any).stock < 10 ? 'text-amber-600' : 'text-slate-800'}`}>
                              {(item as any).stock}
                            </span>
                            <button
                              onClick={() => handleStockChange(item, 1)}
                              className="w-11 h-11 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 text-sm font-bold"
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
                        className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          (item as any).is_featured
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {(item as any).is_featured ? "Featured" : "Promote"}
                      </button>
                    </td>
                  )}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(item as any).discount_percent > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">-{(item as any).discount_percent}%</span>
                      )}
                      <p className="font-extrabold text-slate-800">
                        {(item as any).original_price ? (
                          <>
                            <span className="line-through text-slate-400 text-xs mr-1">₹{(item as any).original_price}</span>
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
                        className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
                      >
                        <span className="material-symbols-outlined text-slate-600 text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
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
              <h2 className="text-xl font-extrabold text-slate-900">
                Add {vendorKey === "food" ? "Menu Item" : vendorKey === "grocery" ? "Product" : vendorKey === "pharmacy" ? "Medicine" : "Item"}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder={vendorKey === "food" ? "e.g., Butter Chicken" : vendorKey === "grocery" ? "e.g., Organic Apples" : vendorKey === "pharmacy" ? "e.g., Paracetamol" : "e.g., Rose Bouquet"}
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
                  value={newItem.category || categories[0]}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {(vendorKey === "food" || vendorKey === "flowers") && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Brief description"
                    rows={2}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] resize-none"
                  />
                </div>
              )}
              {(vendorKey === "grocery" || vendorKey === "pharmacy") && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                    placeholder="e.g., 100"
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                  />
                </div>
              )}
              {(vendorKey === "food") && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                    placeholder="e.g., 50"
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
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
                      className="w-5 h-5 accent-[#ba001c]"
                    />
                    <span className="text-sm font-bold text-red-700">Put on Sale</span>
                  </label>
                  {newItem.has_discount && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-2 block">Discount %</label>
                      <div className="flex gap-2">
                        {[10, 15, 20, 25, 30, 40, 50].map((p) => (
                          <button
                            key={p}
                            onClick={() => setNewItem({ ...newItem, discount_percent: p })}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                              newItem.discount_percent === p
                                ? "bg-[#ba001c] text-white shadow-md"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                      {newItem.price && (
                        <p className="text-xs text-slate-500 mt-2">
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
              )}
              {vendorKey === "food" && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Available For</label>
                  <select
                    value={newItem.menu_slot || "all_day"}
                    onChange={(e) => setNewItem({ ...newItem, menu_slot: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
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
                      className="w-5 h-5 accent-[#ba001c]"
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
                      className="w-5 h-5 accent-[#ba001c]"
                    />
                    <span className="text-sm font-semibold text-slate-700">Requires Prescription</span>
                  </label>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-slate-700">Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setNewItem({ ...newItem, imageFiles: [...(newItem.imageFiles || []), ...files] });
                    e.target.value = "";
                  }}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-[#ba001c] file:text-white file:font-bold file:text-xs hover:file:bg-[#a40017]"
                />
                {newItem.imageFiles?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newItem.imageFiles.map((file: File, idx: number) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setNewItem({
                            ...newItem,
                            imageFiles: newItem.imageFiles.filter((_: File, i: number) => i !== idx)
                          })}
                          className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-xl"
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
                    className="text-xs font-bold text-[#ba001c] hover:underline"
                  >
                    {newItem.showUrlInput ? "Hide URL input" : "Or enter image URL instead"}
                  </button>
                  {newItem.showUrlInput && (
                    <input
                      type="url"
                      value={newItem.image_url}
                      onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value, imageFiles: [] })}
                      placeholder="https://example.com/image.jpg"
                      className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#ba001c]"
                    />
                  )}
                </div>
              </div>
              <button
                onClick={handleAddItem}
                disabled={uploading}
                className="w-full py-4 bg-[#ba001c] text-white font-extrabold rounded-2xl mt-4 hover:bg-[#a40017] transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : `Add ${vendorKey === "pharmacy" ? "Medicine" : vendorKey === "grocery" ? "Product" : "Item"}`}
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
              <h2 className="text-xl font-extrabold text-slate-900">Edit Item</h2>
              <button onClick={() => setEditingItem(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Name</label>
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
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {(vendorKey === "food" || vendorKey === "flowers") && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea
                    value={(editingItem as MenuItem).description || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    rows={2}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] resize-none"
                  />
                </div>
              )}
              {(vendorKey === "food" || vendorKey === "grocery" || vendorKey === "pharmacy") && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={(editingItem as any).stock}
                    onChange={(e) => setEditingItem({ ...editingItem, stock: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                  />
                </div>
              )}
              {vendorKey === "food" && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={(editingItem as any).discount_percent > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingItem({ ...editingItem, discount_percent: 20, original_price: editingItem.price } as AnyItem);
                        } else {
                          setEditingItem({ ...editingItem, discount_percent: 0 } as AnyItem);
                        }
                      }}
                      className="w-5 h-5 accent-[#ba001c]"
                    />
                    <span className="text-sm font-bold text-red-700">On Sale</span>
                  </label>
                  {(editingItem as any).discount_percent > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-2 block">Discount %</label>
                      <div className="flex gap-2">
                        {[10, 15, 20, 25, 30, 40, 50].map((p) => (
                          <button
                            key={p}
                            onClick={() => setEditingItem({ ...editingItem, discount_percent: p } as AnyItem)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                              (editingItem as any).discount_percent === p
                                ? "bg-[#ba001c] text-white shadow-md"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Original: ₹{((editingItem as any).original_price || editingItem.price).toFixed(2)} →{" "}
                        <span className="font-bold text-red-600">
                          ₹{Math.round(((editingItem as any).original_price || editingItem.price) * (1 - ((editingItem as any).discount_percent || 0) / 100) * 100) / 100}
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
                      checked={!!(editingItem as any).is_featured}
                      onChange={(e) => setEditingItem({ ...editingItem, is_featured: e.target.checked } as any)}
                      className="w-5 h-5 accent-[#ba001c]"
                    />
                    <span className="text-sm font-bold text-amber-700">Promote as Featured</span>
                  </label>
                  <p className="text-xs text-amber-600 mt-2 ml-8">Featured items appear first on your menu</p>
                </div>
              )}
              {vendorKey === "food" && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Type</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={(editingItem as MenuItem).is_veg}
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
                        checked={!(editingItem as MenuItem).is_veg}
                        onChange={() => setEditingItem({ ...editingItem, is_veg: false })}
                        className="accent-[#ba001c]"
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
                  <label className="text-sm font-semibold text-slate-700">Available For</label>
                  <select
                    value={(editingItem as any).menu_slot || "all_day"}
                    onChange={(e) => setEditingItem({ ...editingItem, menu_slot: e.target.value })}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
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
                      className="w-5 h-5 accent-[#ba001c]"
                    />
                    <span className="text-sm font-semibold text-slate-700">Requires Prescription</span>
                  </label>
                </div>
              )}
              {editingItem && ((editingItem as any).images?.length > 0 || (editingItem as any).image_url) && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Current Images</label>
                  <div className="flex flex-wrap gap-2">
                    {((editingItem as any).images?.length > 0 ? (editingItem as any).images : [(editingItem as any).image_url]).map((url: string, idx: number) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            const imgs = ((editingItem as any).images || [(editingItem as any).image_url]).filter((_: string, i: number) => i !== idx);
                            setEditingItem({ ...editingItem, images: imgs, image_url: imgs[0] || null } as AnyItem);
                          }}
                          className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-xl"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-slate-700">Add Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    const newUrls: string[] = [];
                    for (const file of files) {
                      setUploading(true);
                      const url = await uploadImage(file);
                      if (url) newUrls.push(url);
                      setUploading(false);
                    }
                    if (newUrls.length > 0) {
                      const existing: string[] = (editingItem as any).images || ((editingItem as any).image_url ? [(editingItem as any).image_url] : []);
                      const all = [...existing, ...newUrls];
                      setEditingItem({ ...editingItem, images: all, image_url: all[0] } as AnyItem);
                    }
                    e.target.value = "";
                  }}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-[#ba001c] file:text-white file:font-bold file:text-xs hover:file:bg-[#a40017]"
                />
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...(editingItem as any), _showUrlInput: !(editingItem as any)._showUrlInput })}
                    className="text-xs font-bold text-[#ba001c] hover:underline"
                  >
                    {(editingItem as any)._showUrlInput ? "Hide URL input" : "Or enter URL instead"}
                  </button>
                  {(editingItem as any)._showUrlInput && (
                    <input
                      type="url"
                      value={(editingItem as any).image_url || ""}
                      onChange={(e) => setEditingItem({ ...(editingItem as any), image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#ba001c]"
                    />
                  )}
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
                  disabled={uploading}
                  className="flex-1 py-4 bg-[#ba001c] text-white font-extrabold rounded-2xl hover:bg-[#a40017] transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">Manage Categories</h2>
              <button onClick={() => setShowCategoryModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
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
                      className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#ba001c]"
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 px-3 py-2 text-sm font-medium">{cat}</span>
                  )}
                  {editingCategory?.oldName !== cat && (
                    <>
                      <button
                        onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <span className="material-symbols-outlined text-lg text-slate-500">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete category "${cat}"? Items in this category won't be deleted.`)) {
                            saveCategories(vendorCategories.filter(c => c !== cat));
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg"
                      >
                        <span className="material-symbols-outlined text-lg text-red-400">delete</span>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
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
                className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#ba001c]"
              />
              <button
                onClick={() => {
                  if (newCategoryName.trim()) {
                    saveCategories([...vendorCategories, newCategoryName.trim()]);
                    setNewCategoryName("");
                  }
                }}
                className="px-5 py-3 bg-[#ba001c] text-white font-bold rounded-xl text-sm hover:bg-[#a40017]"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowQRModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 m-4 text-center" onClick={e => e.stopPropagation()}>
            <span className="material-symbols-outlined text-6xl text-slate-800 mb-4">qr_code_scanner</span>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Menu QR Code</h2>
            <p className="text-sm text-slate-500 mb-6">Scan to view {selectedVendor?.shop_name || "store"}'s menu</p>
            {selectedVendorId && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/app/vendor/${selectedVendorId}`)}`}
                alt="Menu QR Code"
                className="w-48 h-48 mx-auto mb-6"
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50"
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
                className="flex-1 py-3 bg-[#ba001c] text-white font-bold rounded-xl text-sm hover:bg-[#a40017]"
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
