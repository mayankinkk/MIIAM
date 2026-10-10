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
    <div className="px-4 pb-3">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="material-symbols-outlined text-amber-500"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
        <h2 className="text-on-surface text-lg font-bold">{t.home.featuredToday}</h2>
      </div>
      <Link
        href={`/app/vendor/${restaurant.id}`}
        className="relative block overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white"
      >
        <div className="absolute -right-6 -bottom-6 h-40 w-40 rounded-full bg-[var(--color-surface-container-lowest)]/10 blur-2xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-surface-container-lowest)]/20">
            {restaurant.cover_image_url || restaurant.image_url ? (
              <BlurImage
                src={restaurant.cover_image_url || restaurant.image_url || ""}
                alt={`${restaurant.name || restaurant.shop_name} featured`}
                fill
                className="h-full w-full"
                sizes="80px"
              />
            ) : (
              <span className="text-3xl">🍽️</span>
            )}
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs font-bold">
                ⭐ {t.home.featured}
              </span>
            </div>
            <h3 className="text-xl font-bold">{restaurant.name || restaurant.shop_name}</h3>
            <p className="text-sm text-white/80">{restaurant.cuisine || t.home.variousCuisines}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-[var(--color-surface-container-lowest)]/20 px-2 py-1 text-xs font-bold">
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
