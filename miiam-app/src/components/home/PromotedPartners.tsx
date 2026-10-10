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
    <div className="px-4 pb-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-accent"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
          <h2 className="text-on-surface text-lg font-bold">{t.home.promotedPartners}</h2>
        </div>
      </div>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
        {restaurants.map((restaurant) => (
          <Link
            key={restaurant.id}
            href={`/app/vendor/${restaurant.id}`}
            className="bg-surface-container-lowest border-outline-variant/10 hover:border-accent/40 w-36 flex-shrink-0 overflow-hidden rounded-2xl border shadow-sm transition-all"
          >
            <div className="bg-surface-container relative h-28">
              {restaurant.cover_image_url || restaurant.image_url ? (
                <BlurImage
                  src={restaurant.cover_image_url || restaurant.image_url || ""}
                  alt={`${restaurant.shop_name || restaurant.name} promoted`}
                  fill
                  className="h-full w-full"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🍽️</div>
              )}
              {restaurant.is_promoted && (
                <div className="bg-primary text-on-primary absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold">
                  {t.home.promoted}
                </div>
              )}
              {restaurant.is_new && (
                <div className="absolute top-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {t.home.new}
                </div>
              )}
            </div>
            <div className="p-2">
              <h4 className="text-on-surface truncate text-sm font-bold">
                {restaurant.name || restaurant.shop_name}
              </h4>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs font-bold text-green-700">
                  ★ {restaurant.rating || 4.0}
                </span>
                <span className="text-on-surface-variant/70 text-xs">
                  • {restaurant.cuisine?.split(",")[0] || t.home.various}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
