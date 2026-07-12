"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useFavoritesStore } from "@/lib/store/favoritesStore";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";
import EmptyState from "@/components/EmptyState";
import { VendorCardSkeleton } from "@/components/Skeleton";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import PullToRefresh from "@/components/PullToRefresh";
import { useState, useEffect, useMemo, useCallback } from "react";

interface FavoriteVendor {
  id: string;
  shop_name: string;
  name?: string;
  cuisine?: string;
  rating: number;
  cover_image_url?: string;
  image_url?: string;
  delivery_time_min?: number;
  delivery_time_max?: number;
  delivery_time_minutes?: number;
  delivery_time?: string;
}

export default function FavoritesPage() {
  const supabase = useMemo(() => createClient(), []);
  const { favoriteIds, toggle, setFavorites } = useFavoritesStore();
  const [favorites, setFavoriteVendors] = useState<FavoriteVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  const loadFavorites = useCallback(async () => {
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
          vendorIds = userFavorites.map((f: { vendor_id: string }) => f.vendor_id);
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
      logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Error loading favorites");
      addToast("Failed to load favorites. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, favoriteIds, addToast, setFavorites]);

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
      logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Error toggling favorite");
      addToast("Failed to update favorites. Please try again.", "error");
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return (
    <PullToRefresh onRefresh={loadFavorites}>
      <header className="fixed top-0 w-full z-50 flex items-center gap-4 px-6 py-4 bg-surface/80 dark:bg-[var(--color-surface)]/80 backdrop-blur-2xl shadow-sm">
        <Link href="/app/home" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </Link>
        <span className="text-2xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        <span className="text-on-surface font-semibold ml-2">Favourites</span>
      </header>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/home' }, { label: 'My Favorites' }]} />

      <main className="pt-24 pb-24 px-6 max-w-4xl mx-auto">
        <section className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight leading-none mb-2 text-primary">Your Faves</h1>
          <p className="text-on-surface-variant text-lg">Places you&apos;ve saved for later.</p>
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
              actionHref="/app/home" 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favorites.map((vendor) => (
              <div key={vendor.id} className="relative group">
                <Link
                  href={`/app/vendor/${vendor.id}`}
                  className="block bg-surface-container-lowest dark:bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="h-48 bg-surface-container dark:bg-[var(--color-surface-container)] overflow-hidden">
                    <BlurImage src={vendor.cover_image_url || vendor.image_url || ""} alt={vendor.name || vendor.shop_name} fill className="w-full h-full group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-on-surface text-lg">{vendor.shop_name || vendor.name}</h3>
                        <span className="text-xs bg-primary-container/20 text-on-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{vendor.cuisine || "Food"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-on-surface">
                        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {vendor.rating.toFixed(1)}
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2">
                      {vendor.delivery_time_min ? `${vendor.delivery_time_min}–${vendor.delivery_time_max || vendor.delivery_time_min + 15} min` : vendor.delivery_time_minutes ? `${vendor.delivery_time_minutes - 5}–${vendor.delivery_time_minutes + 5} mins` : (vendor.delivery_time || "30-40 mins")}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); handleToggle(vendor.id); }}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transition-all active:scale-90 hover:bg-primary-dim"
                  aria-label="Remove from favourites"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </PullToRefresh>
  );
}
