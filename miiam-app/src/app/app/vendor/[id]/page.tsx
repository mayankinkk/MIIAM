"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import CustomizationModal from "@/components/food/CustomizationModal";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import { getCurrentMenuSlot } from "@/lib/menuSlots";

export default function VendorPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const supabase = useMemo(() => createClient(), []);
  const [vendor, setVendor] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non_veg">("all");
  const [customizingItem, setCustomizingItem] = useState<any>(null);
  const [imageIndex, setImageIndex] = useState<Record<string, number>>({});
  const { addItem, items, updateQuantity } = useCartStore();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: vendorData } = await supabase
          .from("vendors")
          .select("*")
          .eq("id", vendorId)
          .single();

        if (vendorData) setVendor(vendorData);

        let itemsTable = "menu_items";
        if (vendorData?.type === "grocery") itemsTable = "grocery_products";
        else if (vendorData?.type === "pharmacy") itemsTable = "pharmacy_medicines";
        else if (vendorData?.type === "flower" || vendorData?.type === "flowers") itemsTable = "flower_items";

        const { data: menuData } = await supabase
          .from(itemsTable)
          .select("*")
          .eq("vendor_id", vendorId);

        if (menuData) setMenuItems(menuData);

        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("*, profile:profiles(full_name, avatar_url)")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (reviewsData) setReviews(reviewsData);
      } catch (err) {
        console.error("Failed to load vendor data:", err);
      }
      setLoading(false);
    }
    loadData();
  }, [vendorId]);

  const getQty = (id: string) => items.find((i) => i.menu_item_id === id)?.quantity || 0;

  const categories = ["All", ...new Set(menuItems.map((m) => m.category).filter(Boolean))];

  const currentSlot = getCurrentMenuSlot();

  const filteredItems = menuItems.filter((m) => {
    const categoryMatch = activeCategory === "All" || m.category === activeCategory;
    const vegMatch = vendor?.type === "food" ? (vegFilter === "all" || m.is_veg === (vegFilter === "veg")) : true;
    const slotMatch = !m.menu_slot || m.menu_slot === "all_day" || m.menu_slot === currentSlot;
  return categoryMatch && vegMatch && slotMatch;
});
const sortedItems = [...filteredItems].sort((a, b) => (((b as any).is_featured || (b as any).featured) ? 1 : 0) - (((a as any).is_featured || (a as any).featured) ? 1 : 0));

  const handleCustomizeItem = (item: any) => {
    // Only food/restaurant vendors should use the customization modal, NOT grocery/pharmacy/etc.
    const isFoodVendor = vendor && (vendor.type === "food" || vendor.type === "restaurant" || vendor.cuisine);
    const isGroceryOrOther = vendor && (vendor.type === "grocery" || vendor.type === "pharmacy" || vendor.type === "flower" || vendor.type === "flowers");
    
    if (isFoodVendor && !isGroceryOrOther) {
      setCustomizingItem(item);
    } else {
      handleAddToCart(item);
    }
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
    }, item.quantity || 1);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    const current = items.find((i) => i.menu_item_id === id)?.quantity || 0;
    updateQuantity(id, current + delta);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <span className="material-symbols-outlined text-6xl text-primary animate-spin">sync</span>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-on-surface-variant)]">Vendor not found</p>
          <Link href="/app/food" className="text-primary font-bold mt-4 block">Go Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-24">
      <div className="relative h-56 overflow-hidden">
        {vendor.banner_url || vendor.cover_image_url || vendor.image_url ? (
        <BlurImage src={vendor.banner_url || vendor.cover_image_url || vendor.image_url} alt={vendor.shop_name} fill className="w-full h-full" sizes="100vw" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-slate-300 to-slate-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <button onClick={() => router.back()} aria-label="Go back" className="absolute top-4 left-4 bg-[var(--color-surface-container-lowest)]/90 p-2 rounded-full shadow-md">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-3xl font-black text-white">{vendor.shop_name}</h1>
          <p className="text-white/80 text-sm mt-1">{vendor.cuisine} • {vendor.address}</p>
        </div>
      </div>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: vendor.shop_name }]} />

      {/* Restaurant Info Bar */}
      <div className="bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-border-subtle)] px-4 py-3">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold">
            <span className="material-symbols-outlined text-sm">star</span>
            {vendor.rating || 4.5}
          </div>
          <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] text-sm font-semibold">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {vendor.delivery_time_min || 30}-{vendor.delivery_time_max || 45} min • ₹{vendor.min_order_amount} for two
          </div>
          <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-bold capitalize">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {currentSlot}
          </div>
          {vendor.is_veg === true && (
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold">
              🌿 Pure Veg
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-border-subtle)] px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--color-on-surface)]">Customer Reviews</h2>
            <Link href={`/app/vendor/${vendorId}/reviews`} className="text-sm text-primary font-bold">
              See All
            </Link>
          </div>
          <div className="space-y-3">
            {reviews.slice(0, 3).map((review: any) => (
              <div key={review.id} className="bg-[var(--color-surface-subtle)] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {review.profile?.full_name?.[0] || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-on-surface)]">{review.profile?.full_name || "User"}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`material-symbols-outlined text-sm ${
                            star <= review.rating ? "text-primary" : "text-[var(--color-outline-variant)]/60"
                          }`}
                          style={{ fontVariationSettings: `'FILL' ${star <= review.rating ? 1 : 0}` }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--color-outline-variant)] ml-auto">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.review_text && (
                  <p className="text-sm text-[var(--color-on-surface-variant)]">{review.review_text}</p>
                )}
                {review.tags && review.tags.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {review.tags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restaurant Details */}
      <div className="bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-border-subtle)] px-4 py-4">
        <div className="flex items-start gap-3 mb-3">
          <span className="material-symbols-outlined text-primary">location_on</span>
          <div>
            <p className="font-semibold text-[var(--color-on-surface)] text-sm">{vendor.address || "Address not available"}</p>
            <p className="text-xs text-[var(--color-outline)] mt-1">Live tracking not available for this restaurant</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="material-symbols-outlined text-primary">access_time</span>
          <div>
            <p className="font-semibold text-[var(--color-on-surface)]">Open now</p>
            <p className="text-xs text-[var(--color-outline)]">9:00 AM - 10:00 PM (Today)</p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 bg-[var(--color-surface-container-lowest)] z-10 border-b overflow-x-auto">
        <div className="flex gap-4 p-4 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeCategory === cat ? "bg-primary text-white" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {(!vendor || vendor.type === "food" || vendor.type === "restaurant" || vendor.cuisine) && (
          <div className="flex gap-2 px-4 pb-3">
            <button onClick={() => setVegFilter("all")} className={`px-4 py-2.5 rounded-full text-xs font-bold ${vegFilter === "all" ? "bg-slate-800 text-white" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"}`}>
              {t.food.all}
            </button>
            <button onClick={() => setVegFilter("veg")} className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "veg" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}>
              <span className="w-3 h-3 border-2 border-green-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span> {t.food.veg}
            </button>
            <button onClick={() => setVegFilter("non_veg")} className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "non_veg" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>
              <span className="w-3 h-3 border-2 border-red-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span> {t.food.nonVeg}
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <h2 className="text-xl font-black text-[var(--color-on-surface)]">Menu</h2>
        {filteredItems.length === 0 ? (
          <p className="text-[var(--color-outline-variant)] text-center py-8">No menu items available</p>
        ) : (
          sortedItems.map((item) => {
            const qty = getQty(item.id);
            return (
              <div key={item.id} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 flex gap-4 shadow-sm">
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--color-surface-container)] relative cursor-pointer" onClick={() => {
                  const imgs = item.images?.filter(Boolean) || (item.image_url ? [item.image_url] : []);
                  if (imgs.length > 1) {
                    setImageIndex((prev: Record<string, number>) => ({
                      ...prev,
                      [item.id]: ((prev[item.id] || 0) + 1) % imgs.length
                    }));
                  }
                }}>
                  {(() => {
                    const imgs = item.images?.filter(Boolean) || (item.image_url ? [item.image_url] : []);
                    const idx = imageIndex[item.id] || 0;
                    const src = imgs[idx] || item.image_url;
                    return src ? (
                      <BlurImage key={idx} src={src} alt={item.name} fill className="w-full h-full" sizes="(max-width: 768px) 50vw, 25vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--color-outline-variant)]/60">restaurant</span>
                      </div>
                    );
                  })()}
                  {(() => {
                    const imgs = item.images?.filter(Boolean) || (item.image_url ? [item.image_url] : []);
                    return imgs.length > 1 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                        {imgs.map((_: string, i: number) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === (imageIndex[item.id] || 0) ? 'bg-white' : 'bg-white/50'}`} />
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    {item.is_veg !== undefined && (
                      <span className={`w-3.5 h-3.5 border-2 ${item.is_veg ? "border-green-600" : "border-red-600"} rounded-sm flex items-center justify-center flex-shrink-0`}>
                        <span className={`w-1.5 h-1.5 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`}></span>
                      </span>
                    )}
                    <h3 className="font-bold text-[var(--color-on-surface)]">{item.name}</h3>
                    {((item as any).is_featured || (item as any).featured) && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">★ Featured</span>
                    )}
                    {item.discount_percent > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">-{item.discount_percent}%</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-outline)] mt-1">{item.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[var(--color-on-surface)]">
                      {item.original_price ? (
                        <>
                          <span className="line-through text-[var(--color-outline-variant)] text-xs mr-1">₹{item.original_price}</span>
                          ₹{item.price}
                        </>
                      ) : (
                        <>₹{item.price}</>
                      )}
                    </span>
                    {qty === 0 ? (
                      <button
                        onClick={() => handleCustomizeItem(item)}
                        className="px-4 py-1.5 bg-primary text-white text-sm font-bold rounded-full"
                      >
                        Add +
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-primary rounded-full px-1 py-0.5">
                        <button onClick={() => handleUpdateQty(item.id, -1)} className="text-white font-bold w-11 h-11 flex items-center justify-center rounded-full">-</button>
                        <span className="text-white font-bold text-sm min-w-[2ch] text-center">{qty}</span>
                        <button onClick={() => handleUpdateQty(item.id, 1)} className="text-white font-bold w-11 h-11 flex items-center justify-center rounded-full">+</button>
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
          vendor_type={vendor?.type}
          onClose={() => setCustomizingItem(null)}
          onAdd={handleAddToCart}
        />
      )}
    </div>
  );
}