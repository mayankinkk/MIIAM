"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorForUser } from "@/lib/vendor";
import { useToastStore } from "@/lib/store/toastStore";
import { VendorTableSkeleton } from "@/components/vendor/VendorSkeleton";

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: boolean;
  stock_quantity: number | null;
  low_stock_threshold: number;
}

export default function PartnerInventoryPage() {
  const supabase = useMemo(() => createClient(), []);
  const [vendor, setVendor] = useState<{ id: string; shop_name: string; type?: string } | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "in_stock" | "out_of_stock" | "low_stock">("all");
  const { addToast } = useToastStore();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const v = await getVendorForUser();
    if (v) {
      setVendor({ id: v.id, shop_name: v.shop_name, type: v.type });
      await loadItems(v.id, v.type);
    }
    setLoading(false);
  }

  async function loadItems(vendorId: string, vendorType?: string) {
    const table = vendorType === "grocery" ? "grocery_products" : "menu_items";
    const { data } = await supabase
      .from(table)
      .select("id, name, price, category, image_url, is_available, stock_quantity, low_stock_threshold")
      .eq("vendor_id", vendorId)
      .order("name");

    if (data) {
      setItems(data.map((item: Record<string, unknown>) => ({
        ...item,
        stock_quantity: item.stock_quantity ?? null,
        low_stock_threshold: item.low_stock_threshold ?? 5,
      })));
    }
  }

  async function toggleAvailability(itemId: string, current: boolean) {
    const table = vendor?.type === "grocery" ? "grocery_products" : "menu_items";
    const { error } = await supabase
      .from(table)
      .update({ is_available: !current })
      .eq("id", itemId);

    if (!error) {
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, is_available: !current } : item
      ));
      addToast(current ? "Item marked out of stock" : "Item marked in stock", "success");
    }
  }

  async function updateStock(itemId: string, quantity: number) {
    const table = vendor?.type === "grocery" ? "grocery_products" : "menu_items";
    const { error } = await supabase
      .from(table)
      .update({ stock_quantity: quantity })
      .eq("id", itemId);

    if (!error) {
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, stock_quantity: quantity } : item
      ));
    }
  }

  async function updateThreshold(itemId: string, threshold: number) {
    const table = vendor?.type === "grocery" ? "grocery_products" : "menu_items";
    await supabase
      .from(table)
      .update({ low_stock_threshold: threshold })
      .eq("id", itemId);

    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, low_stock_threshold: threshold } : item
    ));
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" ||
      (filter === "in_stock" && item.is_available) ||
      (filter === "out_of_stock" && !item.is_available) ||
      (filter === "low_stock" && item.stock_quantity !== null && item.stock_quantity <= item.low_stock_threshold && item.is_available);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: items.length,
    inStock: items.filter(i => i.is_available).length,
    outOfStock: items.filter(i => !i.is_available).length,
    lowStock: items.filter(i => i.stock_quantity !== null && i.stock_quantity <= i.low_stock_threshold && i.is_available).length,
  };

  if (loading) {
    return <div className="p-4 md:p-8"><VendorTableSkeleton rows={5} /></div>;
  }

  if (!vendor) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/60 mb-4">inventory_2</span>
        <h2 className="text-2xl font-extrabold text-on-surface mb-2">No Vendor Found</h2>
        <p className="text-on-surface-variant">Register your store first.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-on-surface">Inventory</h1>
        <p className="text-on-surface-variant text-sm mt-1">Manage stock levels for {vendor.shop_name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-on-surface" },
          { label: "In Stock", value: stats.inStock, color: "text-green-600" },
          { label: "Out of Stock", value: stats.outOfStock, color: "text-red-600" },
          { label: "Low Stock", value: stats.lowStock, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-on-surface-variant">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-12 pr-4 py-3 bg-surface-container rounded-2xl border border-outline-variant/20 focus:border-primary outline-none text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {([
            { key: "all", label: "All" },
            { key: "in_stock", label: "In Stock" },
            { key: "out_of_stock", label: "Out of Stock" },
            { key: "low_stock", label: "Low Stock" },
          ] as const).map((chip) => (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filter === chip.key
                  ? "bg-primary text-white"
                  : "bg-surface-container text-on-surface-variant border border-outline-variant/20"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">inventory_2</span>
            <p className="text-on-surface-variant mt-2 text-sm">No items found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className={`bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 ${!item.is_available ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant/30">inventory_2</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-on-surface truncate">{item.name}</h3>
                    {item.stock_quantity !== null && item.stock_quantity <= item.low_stock_threshold && item.is_available && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">LOW</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant">{item.category} · ₹{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAvailability(item.id, item.is_available)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      item.is_available
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {item.is_available ? "In Stock" : "Out"}
                  </button>
                </div>
              </div>
              {/* Stock quantity control */}
              <div className="flex items-center gap-3 mt-3 pl-15">
                <span className="text-xs text-on-surface-variant">Stock:</span>
                <button
                  onClick={() => updateStock(item.id, Math.max(0, (item.stock_quantity ?? 0) - 1))}
                  className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-sm font-bold"
                >-</button>
                <input
                  type="number"
                  value={item.stock_quantity ?? ""}
                  onChange={(e) => updateStock(item.id, parseInt(e.target.value) || 0)}
                  placeholder="∞"
                  className="w-16 text-center text-sm font-bold bg-surface-container rounded-lg px-2 py-1 border border-outline-variant/20 focus:border-primary outline-none"
                />
                <button
                  onClick={() => updateStock(item.id, (item.stock_quantity ?? 0) + 1)}
                  className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-sm font-bold"
                >+</button>
                <span className="text-[10px] text-on-surface-variant ml-2">Low at:</span>
                <input
                  type="number"
                  value={item.low_stock_threshold}
                  onChange={(e) => updateThreshold(item.id, parseInt(e.target.value) || 5)}
                  className="w-12 text-center text-xs bg-surface-container rounded-lg px-1 py-1 border border-outline-variant/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
