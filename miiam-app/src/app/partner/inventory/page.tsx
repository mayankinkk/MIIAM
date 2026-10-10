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
  const [vendor, setVendor] = useState<{ id: string; shop_name: string; type?: string } | null>(
    null
  );
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
      .select(
        "id, name, price, category, image_url, is_available, stock_quantity, low_stock_threshold"
      )
      .eq("vendor_id", vendorId)
      .order("name");

    if (data) {
      setItems(
        data.map((item: Record<string, unknown>) => ({
          ...item,
          stock_quantity: item.stock_quantity ?? null,
          low_stock_threshold: item.low_stock_threshold ?? 5,
        }))
      );
    }
  }

  async function toggleAvailability(itemId: string, current: boolean) {
    const table = vendor?.type === "grocery" ? "grocery_products" : "menu_items";
    const { error } = await supabase
      .from(table)
      .update({ is_available: !current })
      .eq("id", itemId);

    if (!error) {
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, is_available: !current } : item))
      );
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
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, stock_quantity: quantity } : item))
      );
    }
  }

  async function updateThreshold(itemId: string, threshold: number) {
    const table = vendor?.type === "grocery" ? "grocery_products" : "menu_items";
    await supabase.from(table).update({ low_stock_threshold: threshold }).eq("id", itemId);

    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, low_stock_threshold: threshold } : item))
    );
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "in_stock" && item.is_available) ||
      (filter === "out_of_stock" && !item.is_available) ||
      (filter === "low_stock" &&
        item.stock_quantity !== null &&
        item.stock_quantity <= item.low_stock_threshold &&
        item.is_available);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: items.length,
    inStock: items.filter((i) => i.is_available).length,
    outOfStock: items.filter((i) => !i.is_available).length,
    lowStock: items.filter(
      (i) =>
        i.stock_quantity !== null && i.stock_quantity <= i.low_stock_threshold && i.is_available
    ).length,
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <VendorTableSkeleton rows={5} />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined text-on-surface-variant/60 mb-4 text-6xl">
          inventory_2
        </span>
        <h2 className="text-on-surface mb-2 text-2xl font-extrabold">No Vendor Found</h2>
        <p className="text-on-surface-variant">Register your store first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-on-surface text-2xl font-extrabold">Inventory</h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Manage stock levels for {vendor.shop_name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-on-surface" },
          { label: "In Stock", value: stats.inStock, color: "text-green-600" },
          { label: "Out of Stock", value: stats.outOfStock, color: "text-red-600" },
          { label: "Low Stock", value: stats.lowStock, color: "text-amber-600" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-surface-container-lowest border-outline-variant/10 rounded-xl border p-3 text-center"
          >
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-on-surface-variant text-[10px]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="relative">
          <span className="material-symbols-outlined text-on-surface-variant absolute top-1/2 left-4 -translate-y-1/2 text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="bg-surface-container border-outline-variant/20 focus:border-primary w-full rounded-2xl border py-3 pr-4 pl-12 text-sm outline-none"
          />
        </div>
        <div className="scrollbar-hide flex gap-2 overflow-x-auto">
          {(
            [
              { key: "all", label: "All" },
              { key: "in_stock", label: "In Stock" },
              { key: "out_of_stock", label: "Out of Stock" },
              { key: "low_stock", label: "Low Stock" },
            ] as const
          ).map((chip) => (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                filter === chip.key
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant border-outline-variant/20 border"
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
            <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl">
              inventory_2
            </span>
            <p className="text-on-surface-variant mt-2 text-sm">No items found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-surface-container-lowest border-outline-variant/10 rounded-xl border p-4 ${!item.is_available ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-surface-container h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant/30">
                        inventory_2
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-on-surface truncate text-sm font-bold">{item.name}</h3>
                    {item.stock_quantity !== null &&
                      item.stock_quantity <= item.low_stock_threshold &&
                      item.is_available && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                          LOW
                        </span>
                      )}
                  </div>
                  <p className="text-on-surface-variant text-xs">
                    {item.category} · ₹{item.price}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAvailability(item.id, item.is_available)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
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
              <div className="mt-3 flex items-center gap-3 pl-15">
                <span className="text-on-surface-variant text-xs">Stock:</span>
                <button
                  onClick={() => updateStock(item.id, Math.max(0, (item.stock_quantity ?? 0) - 1))}
                  className="bg-surface-container flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  value={item.stock_quantity ?? ""}
                  onChange={(e) => updateStock(item.id, parseInt(e.target.value) || 0)}
                  placeholder="∞"
                  className="bg-surface-container border-outline-variant/20 focus:border-primary w-16 rounded-lg border px-2 py-1 text-center text-sm font-bold outline-none"
                />
                <button
                  onClick={() => updateStock(item.id, (item.stock_quantity ?? 0) + 1)}
                  className="bg-surface-container flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold"
                >
                  +
                </button>
                <span className="text-on-surface-variant ml-2 text-[10px]">Low at:</span>
                <input
                  type="number"
                  value={item.low_stock_threshold}
                  onChange={(e) => updateThreshold(item.id, parseInt(e.target.value) || 5)}
                  className="bg-surface-container border-outline-variant/20 focus:border-primary w-12 rounded-lg border px-1 py-1 text-center text-xs outline-none"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
