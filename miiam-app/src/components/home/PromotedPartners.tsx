import Link from "next/link";
import BlurImage from "@/components/BlurImage";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface Restaurant {
  id: string;
  shop_name: string;
  name?: string;
  cuisine?: string;
  image_url?: string;
  cover_image_url?: string;
  rating?: string | number;
  is_new?: boolean;
  is_promoted?: boolean;
}

interface PromotedPartnersProps {
  restaurants: Restaurant[];
}

export default function PromotedPartners({ restaurants }: PromotedPartnersProps) {
  const { t } = useTranslation();

  if (restaurants.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <h2 className="text-lg font-bold text-on-surface">{t.home.promotedPartners}</h2>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {restaurants.map((restaurant) => (
          <Link key={restaurant.id} href={`/app/vendor/${restaurant.id}`} className="flex-shrink-0 w-36 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm hover:border-purple-500/30 transition-all">
            <div className="relative h-28 bg-surface-container">
              {restaurant.cover_image_url || restaurant.image_url ? (
                <BlurImage src={restaurant.cover_image_url || restaurant.image_url || ""} alt={`${restaurant.shop_name || restaurant.name} promoted`} fill className="w-full h-full" sizes="(max-width: 768px) 50vw, 25vw" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
              )}
              {restaurant.is_promoted && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {t.home.promoted}
                </div>
              )}
              {restaurant.is_new && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {t.home.new}
                </div>
              )}
            </div>
            <div className="p-2">
              <h4 className="font-bold text-sm text-on-surface truncate">{restaurant.name || restaurant.shop_name}</h4>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-bold text-green-700">★ {restaurant.rating || 4.0}</span>
                <span className="text-xs text-on-surface-variant/70">• {restaurant.cuisine?.split(",")[0] || t.home.various}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
