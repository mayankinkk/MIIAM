"use client";

import Link from "next/link";
import { useFavoritesStore } from "@/lib/store/favoritesStore";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/EmptyState";
import { VendorCardSkeleton } from "@/components/Skeleton";
import { useState, useEffect } from "react";

const supabase = createClient();

export default function FavoritesPage() {
  const { favoriteIds, toggle, setFavorites } = useFavoritesStore();
  const [favorites, setFavoriteVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let vendorIds = favoriteIds;
        
        if (user) {
          // Fetch from Supabase
          const { data: userFavorites } = await supabase
            .from("favorites")
            .select("vendor_id")
            .eq("user_id", user.id);
            
          if (userFavorites) {
            vendorIds = userFavorites.map(f => f.vendor_id);
            setFavorites(vendorIds); // Sync to local store
          }
        }
        
        if (vendorIds.length > 0) {
          const { data: vendors } = await supabase
            .from("vendors")
            .select("*")
            .in("id", vendorIds);
          setFavoriteVendors(vendors || []);
        } else {
          setFavoriteVendors([]);
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadFavorites();
  }, [favoriteIds.length]);

  const handleToggle = async (vendorId: string) => {
    toggle(vendorId); // Optimistic UI update
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (favoriteIds.includes(vendorId)) {
          // Remove
          await supabase.from("favorites").delete().eq("user_id", user.id).eq("vendor_id", vendorId);
          setFavoriteVendors(prev => prev.filter(v => v.id !== vendorId));
        } else {
          // Add
          await supabase.from("favorites").insert({ user_id: user.id, vendor_id: vendorId });
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 flex items-center gap-4 px-6 py-4 bg-[#fff4f4]/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <Link href="/app/explore" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4] transition-all">
          <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
        </Link>
        <span className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
        <span className="text-[#4d212a] font-semibold ml-2">Favourites</span>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        <section className="mb-10">
          <h1 className="text-[3.5rem] font-extrabold tracking-tight leading-none mb-2 text-[#ba001c]">Your Faves</h1>
          <p className="text-[#814c55] text-lg">Places you&apos;ve saved for later.</p>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VendorCardSkeleton />
            <VendorCardSkeleton />
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              icon="favorite" 
              title="No favourites yet" 
              description="Tap the heart on any restaurant or service to save it here." 
              actionLabel="Explore" 
              actionHref="/app/explore" 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favorites.map((vendor) => (
              <div key={vendor.id} className="relative group">
                <Link
                  href={`/vendor/${vendor.id}`}
                  className="block bg-white rounded-lg overflow-hidden shadow-[0px_10px_30px_rgba(77,33,42,0.04)] hover:shadow-[0px_20px_40px_rgba(77,33,42,0.1)] transition-all"
                >
                  <div className="h-48 bg-[#ffe1e4] overflow-hidden">
                    <img src={vendor.image_url} alt={vendor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-[#4d212a] text-lg">{vendor.shop_name || vendor.name}</h3>
                        <span className="text-xs bg-[#ff7670]/20 text-[#4e0006] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{vendor.cuisine || "Food"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-[#4d212a]">
                        <span className="material-symbols-outlined text-[#ba001c] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {vendor.rating.toFixed(1)}
                      </div>
                    </div>
                    <p className="text-xs text-[#814c55] mt-2">
                      {vendor.delivery_time_minutes ? `${vendor.delivery_time_minutes - 5}–${vendor.delivery_time_minutes + 5} mins` : (vendor.delivery_time || "30-40 mins")}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); handleToggle(vendor.id); }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#ba001c] text-white flex items-center justify-center shadow-lg transition-all active:scale-90 hover:bg-[#a40017]"
                  aria-label="Remove from favourites"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
