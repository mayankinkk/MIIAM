"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface Combo {
  id: string;
  name: string;
  description: string;
  image_url: string;
  original_price: number;
  combo_price: number;
  items: string[];
  vendor_id: string;
  category: string;
}

interface Vendor {
  id: string;
  shop_name: string;
  cuisine: string;
  address: string;
  image_url: string | null;
}

export default function ComboDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const comboId = params.id as string;
  const { addItem } = useCartStore();
  const { addToast } = useToastStore();
  const { confirm } = useConfirm();

  console.log("[ComboDetail] Rendering with comboId:", comboId);

  const [combo, setCombo] = useState<Combo | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCombo() {
      setLoading(true);
      console.log("[ComboDetail] Fetching combo:", comboId);
      
      const { data: comboData, error: comboError } = await supabase
        .from("combos")
        .select("*")
        .eq("id", comboId)
        .single();

      console.log("[ComboDetail] Combo result:", { comboData, comboError });

      if (comboError || !comboData) {
        console.error("[ComboDetail] Combo fetch failed:", comboError);
        setError(comboError?.message || "Combo not found.");
        setLoading(false);
        return;
      }

      setCombo(comboData);

      if (comboData.vendor_id) {
        console.log("[ComboDetail] Fetching vendor:", comboData.vendor_id);
        const { data: vendorData, error: vendorError } = await supabase
          .from("vendors")
          .select("id, shop_name, cuisine, address, image_url")
          .eq("id", comboData.vendor_id)
          .single();
        
        console.log("[ComboDetail] Vendor result:", { vendorData, vendorError });
        if (vendorData) setVendor(vendorData);
      }

      setLoading(false);
    }
    fetchCombo();
  }, [supabase, comboId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6 space-y-4">
        <div className="h-64 w-full bg-surface-container-high animate-pulse rounded-2xl" />
        <div className="h-8 w-2/3 bg-surface-container-high animate-pulse rounded-xl" />
        <div className="h-4 w-1/2 bg-surface-container-high animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6">
        <p className="text-xl font-black text-on-surface mb-2">Combo not found</p>
        <Link href="/app/home" className="text-primary font-bold">Go back</Link>
      </div>
    );
  }

  const savings = combo.original_price - combo.combo_price;
  const discountPct = Math.round((savings / combo.original_price) * 100);

  return (
    <div className="min-h-screen bg-surface pb-8">
      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        {combo.image_url ? (
          <Image src={combo.image_url} alt={combo.name} fill className="object-cover" sizes="100vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-orange-100 to-amber-50">🎉</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-12 sm:pt-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>

        {/* Discount badge */}
        <div className="absolute top-4 right-4 bg-status-error text-white text-sm font-black px-3 py-1.5 rounded-full shadow-lg">
          {discountPct}% OFF
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-white font-black text-2xl sm:text-3xl leading-tight">{combo.name}</h1>
          {vendor && (
            <Link href={`/app/food/${vendor.id}`} className="text-white/80 text-sm mt-1 font-medium hover:underline">
              {vendor.shop_name} · {vendor.cuisine}
            </Link>
          )}
        </div>
      </div>

      {/* Price card */}
      <div className="mx-4 -mt-4 relative z-10 bg-surface-container-lowest rounded-2xl p-5 shadow-md border border-outline-variant/10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-primary">₹{combo.combo_price}</span>
              <span className="text-lg text-on-surface-variant line-through">₹{combo.original_price}</span>
            </div>
            <p className="text-sm text-green-600 font-bold mt-1">You save ₹{savings.toFixed(0)}</p>
          </div>
          {vendor && (
            <>
              <Link
                href={`/app/food/${vendor.id}`}
                className="bg-primary text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary-dim active:scale-95 transition-all"
              >
                View Menu
              </Link>
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: "Add to Cart",
                    message: `Add "${combo.name}" to your cart for ₹${combo.combo_price}?`,
                    variant: "default",
                  });
                  if (ok && vendor) {
                    addItem({
                      id: `combo-${combo.id}`,
                      menu_item_id: `combo-${combo.id}`,
                      vendor_id: vendor.id,
                      vendor_name: vendor.shop_name,
                      name: combo.name,
                      price: combo.combo_price,
                      quantity: 1,
                      image_url: combo.image_url,
                      is_veg: true,
                    });
                    addToast(`${combo.name} added to cart`, "success");
                  }
                }}
                className="bg-primary text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary-dim active:scale-95 transition-all"
              >
                Add to Cart
              </button>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {combo.description && (
        <div className="mx-4 mt-4 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
          <p className="text-sm text-on-surface-variant leading-relaxed">{combo.description}</p>
        </div>
      )}

      {/* Items included */}
      {combo.items && combo.items.length > 0 && (
        <div className="mx-4 mt-4 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
          <h2 className="text-base font-black text-on-surface mb-3">What&apos;s Included</h2>
          <ul className="space-y-2.5">
            {combo.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-xs">check</span>
                </span>
                <span className="text-sm text-on-surface">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Vendor info */}
      {vendor && (
        <Link href={`/app/food/${vendor.id}`} className="mx-4 mt-4 block bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10 active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container flex-shrink-0 relative">
              <Image src={vendor.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80"} alt={vendor.shop_name} fill className="object-cover" sizes="48px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-on-surface text-sm truncate">{vendor.shop_name}</p>
              <p className="text-xs text-on-surface-variant truncate">{vendor.cuisine}</p>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </div>
        </Link>
      )}
    </div>
  );
}
