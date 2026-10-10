"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useFavoritesStore } from "@/lib/store/favoritesStore";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";
import { EmptyState } from "@/components/ui/EmptyStates";
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
        const { data: vendors } = await supabase.from("vendors").select("*").in("id", vendorIds);
        setFavoriteVendors(vendors || []);
      } else {
        setFavoriteVendors([]);
      }
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Error loading favorites"
      );
      addToast("Failed to load favorites. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, favoriteIds, addToast, setFavorites]);

  const handleToggle = async (vendorId: string) => {
    toggle(vendorId); // Optimistic UI update

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        if (favoriteIds.includes(vendorId)) {
          // Remove
          await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("vendor_id", vendorId);
          setFavoriteVendors((prev) => prev.filter((v) => v.id !== vendorId));
        } else {
          // Add
          await supabase.from("favorites").insert({ user_id: user.id, vendor_id: vendorId });
        }
      }
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Error toggling favorite"
      );
      addToast("Failed to update favorites. Please try again.", "error");
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return (
    <PullToRefresh onRefresh={loadFavorites}>
      <header className="bg-surface/80 fixed top-0 z-50 flex w-full items-center gap-4 px-6 py-4 shadow-sm backdrop-blur-2xl dark:bg-[var(--color-surface)]/80">
        <Link
          href="/app/home"
          className="hover:bg-surface-container flex h-10 w-10 items-center justify-center rounded-full transition-all"
        >
          <span className="material-symbols-outlined text-accent">arrow_back</span>
        </Link>
        <span className="text-accent text-2xl font-extrabold tracking-tighter">MIIAM</span>
        <span className="text-on-surface ml-2 font-semibold">Favourites</span>
      </header>

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "My Favorites" }]} />

      <main className="mx-auto max-w-4xl px-6 pt-24 pb-24">
        <section className="mb-10">
          <h1 className="text-on-surface mb-2 text-3xl leading-none font-extrabold tracking-tight">
            Your Faves
          </h1>
          <p className="text-on-surface-variant text-lg">Places you&apos;ve saved for later.</p>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {favorites.map((vendor) => (
              <div key={vendor.id} className="group relative">
                <Link
                  href={`/app/vendor/${vendor.id}`}
                  className="bg-surface-container-lowest block overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-md dark:bg-[var(--color-surface-container-lowest)]"
                >
                  <div className="bg-surface-container h-48 overflow-hidden dark:bg-[var(--color-surface-container)]">
                    <BlurImage
                      src={vendor.cover_image_url || vendor.image_url || ""}
                      alt={vendor.name || vendor.shop_name}
                      fill
                      className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-on-surface text-lg font-bold">
                          {vendor.shop_name || vendor.name}
                        </h3>
                        <span className="bg-primary-container/20 text-on-primary rounded-full px-2 py-0.5 text-xs font-bold tracking-wider uppercase">
                          {vendor.cuisine || "Food"}
                        </span>
                      </div>
                      <div className="text-on-surface flex items-center gap-1 text-sm font-bold">
                        <span
                          className="material-symbols-outlined text-accent text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        {vendor.rating.toFixed(1)}
                      </div>
                    </div>
                    <p className="text-on-surface-variant mt-2 text-xs">
                      {vendor.delivery_time_min
                        ? `${vendor.delivery_time_min}–${vendor.delivery_time_max || vendor.delivery_time_min + 15} min`
                        : vendor.delivery_time_minutes
                          ? `${vendor.delivery_time_minutes - 5}–${vendor.delivery_time_minutes + 5} mins`
                          : vendor.delivery_time || "30-40 mins"}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggle(vendor.id);
                  }}
                  className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all active:scale-90"
                  aria-label="Remove from favourites"
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    favorite
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </PullToRefresh>
  );
}
