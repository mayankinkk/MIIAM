"use client";

import Link from "next/link";
import BlurImage from "@/components/BlurImage";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface SpotlightRestaurant {
  id: string;
  shop_name: string;
  name?: string;
  cuisine?: string;
  image_url?: string;
  cover_image_url?: string;
  rating?: string | number;
}

interface SpotlightCardProps {
  restaurant: SpotlightRestaurant;
}

export default function SpotlightCard({ restaurant }: SpotlightCardProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        <h2 className="text-lg font-bold text-on-surface">{t.home.featuredToday}</h2>
      </div>
      <Link href={`/app/vendor/${restaurant.id}`} className="block relative bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-[var(--color-surface-container-lowest)]/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-20 h-20 bg-[var(--color-surface-container-lowest)]/20 rounded-2xl flex items-center justify-center overflow-hidden">
            {restaurant.cover_image_url || restaurant.image_url ? (
              <BlurImage src={restaurant.cover_image_url || restaurant.image_url || ""} alt={`${restaurant.name || restaurant.shop_name} featured`} fill className="w-full h-full" sizes="80px" />
            ) : (
              <span className="text-3xl">🍽️</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/30 text-xs font-bold px-2 py-0.5 rounded-full">⭐ {t.home.featured}</span>
            </div>
            <h3 className="text-xl font-black">{restaurant.name || restaurant.shop_name}</h3>
            <p className="text-sm text-white/80">{restaurant.cuisine || t.home.variousCuisines}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 bg-[var(--color-surface-container-lowest)]/20 px-2 py-1 rounded-full text-xs font-bold">
                ★ {restaurant.rating || 4.0}
              </span>
              <span className="text-xs text-white/80">{t.home.minDelivery}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
