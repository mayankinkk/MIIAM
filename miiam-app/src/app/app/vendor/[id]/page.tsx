"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import CustomizationModal from "@/components/food/CustomizationModal";

export default function VendorPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const supabase = createClient();
  const [vendor, setVendor] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non_veg">("all");
  const [customizingItem, setCustomizingItem] = useState<any>(null);
  const { addItem, items, updateQuantity } = useCartStore();

  useEffect(() => {
    async function loadData() {
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", vendorId)
        .single();

      if (vendorData) setVendor(vendorData);

      const { data: menuData } = await supabase
        .from("menu_items")
        .select("*")
        .eq("vendor_id", vendorId);

      if (menuData) setMenuItems(menuData);
      setLoading(false);
    }
    loadData();
  }, [vendorId]);

  const getQty = (id: string) => items.find((i) => i.menu_item_id === id)?.quantity || 0;

  const categories = ["All", ...new Set(menuItems.map((m) => m.category).filter(Boolean))];

  const filteredItems = menuItems.filter((m) => {
    const categoryMatch = activeCategory === "All" || m.category === activeCategory;
    const vegMatch = vegFilter === "all" || m.is_veg === (vegFilter === "veg");
    return categoryMatch && vegMatch;
  });

const handleCustomizeItem = (item: any) => {
    setCustomizingItem(item);
  };

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      vendor_id: vendorId,
      vendor_name: vendor?.shop_name,
      special_notes: item.special_notes,
    }, item.quantity || 1);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    const current = items.find((i) => i.menu_item_id === id)?.quantity || 0;
    updateQuantity(id, current + delta);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <span className="material-symbols-outlined text-6xl text-[#ba001c] animate-spin">sync</span>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Vendor not found</p>
          <Link href="/app/food" className="text-[#ba001c] font-bold mt-4 block">Go Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-24">
      <div className="relative h-56 bg-gradient-to-b from-slate-300 to-slate-100">
        <button onClick={() => router.back()} className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-md">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-3xl font-black text-slate-800">{vendor.shop_name}</h1>
          <p className="text-slate-600 text-sm mt-1">{vendor.cuisine} • {vendor.address}</p>
        </div>
      </div>

      {/* Restaurant Info Bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold">
            <span className="material-symbols-outlined text-sm">star</span>
            {vendor.rating || 4.5}
          </div>
          <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {vendor.delivery_time_min || 30}-{vendor.delivery_time_max || 45} min
          </div>
          <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
            <span className="material-symbols-outlined text-sm">restaurant</span>
            ₹{vendor.min_order_amount || 99} for two
          </div>
          {vendor.is_veg && (
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold">
              🌿 Pure Veg
            </div>
          )}
        </div>
      </div>

      {/* Restaurant Details */}
      <div className="bg-white border-b border-slate-100 px-4 py-4">
        <div className="flex items-start gap-3 mb-3">
          <span className="material-symbols-outlined text-[#ba001c]">location_on</span>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{vendor.address || "Address not available"}</p>
            <p className="text-xs text-slate-500 mt-1">Live tracking not available for this restaurant</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="material-symbols-outlined text-[#ba001c]">access_time</span>
          <div>
            <p className="font-semibold text-slate-800">Open now</p>
            <p className="text-xs text-slate-500">9:00 AM - 10:00 PM (Today)</p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 bg-white z-10 border-b overflow-x-auto">
        <div className="flex gap-4 p-4 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeCategory === cat ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2 px-4 pb-3">
          <button onClick={() => setVegFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-bold ${vegFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
            All
          </button>
          <button onClick={() => setVegFilter("veg")} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "veg" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}>
            <span className="w-3 h-3 border-2 border-green-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span> Veg
          </button>
          <button onClick={() => setVegFilter("non_veg")} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "non_veg" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>
            <span className="w-3 h-3 border-2 border-red-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span> Non-Veg
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <h2 className="text-xl font-black text-slate-800">Menu</h2>
        {filteredItems.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No menu items available</p>
        ) : (
          filteredItems.map((item) => {
            const qty = getQty(item.id);
            return (
              <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm">
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-300">restaurant</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 border-2 ${item.is_veg ? "border-green-600" : "border-red-600"} rounded-sm flex items-center justify-center`}>
                      <span className={`w-1.5 h-1.5 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`}></span>
                    </span>
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-slate-800">₹{item.price}</span>
                    {qty === 0 ? (
                      <button
                        onClick={() => handleCustomizeItem(item)}
                        className="px-4 py-1.5 bg-[#ba001c] text-white text-sm font-bold rounded-full"
                      >
                        Add +
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-[#ba001c] rounded-full px-2 py-1">
                        <button onClick={() => handleUpdateQty(item.id, -1)} className="text-white font-bold w-6">-</button>
                        <span className="text-white font-bold text-sm">{qty}</span>
                        <button onClick={() => handleUpdateQty(item.id, 1)} className="text-white font-bold w-6">+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customization Modal */}
      {customizingItem && (
        <CustomizationModal
          item={customizingItem}
          vendor_id={vendorId}
          vendor_name={vendor?.shop_name}
          onClose={() => setCustomizingItem(null)}
          onAdd={handleAddToCart}
        />
      )}
    </div>
  );
}