"use client";

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
  delivery_time_min?: number;
  delivery_time_max?: number;
  delivery_charge?: number | string;
  min_order_amount?: string;
  is_new?: boolean;
  is_featured?: boolean;
  is_promoted?: boolean;
  type?: string;
  pincode?: string;
  city?: string;
}

interface NearbyRestaurantsProps {
  restaurants: Restaurant[];
  hasLocation: boolean;
  hasPincode: boolean;
  displayAddress: string;
  onLocationClick: () => void;
}

export default function NearbyRestaurants({
  restaurants,
  hasLocation,
  hasPincode,
  displayAddress,
  onLocationClick,
}: NearbyRestaurantsProps) {
  const { t } = useTranslation();
  const foodRestaurants = restaurants.filter((r) => r.type === "food" || r.type === "restaurant");

  return (
    <div className="px-4 pb-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-on-surface text-lg font-bold">{t.home.nearbyPopular}</h2>
          <p className="text-on-surface-variant mt-0.5 text-[11px]">
            {foodRestaurants.length} restaurants nearby
          </p>
        </div>
        <Link
          href="/app/food"
          className="text-accent bg-primary/10 rounded-full px-3 py-1.5 text-xs font-bold"
        >
          {t.home.seeAll}
        </Link>
      </div>
      {foodRestaurants.length > 0 ? (
        <div className="space-y-3">
          {foodRestaurants.slice(0, 8).map((restaurant, idx) => (
            <Link
              key={restaurant.id}
              href={`/app/vendor/${restaurant.id}`}
              className="bg-surface-container-lowest border-outline-variant/10 block overflow-hidden rounded-2xl border transition-transform active:scale-[0.98]"
            >
              <div className="flex">
                <div className="bg-surface-container relative h-28 w-28 flex-shrink-0 overflow-hidden">
                  {restaurant.cover_image_url || restaurant.image_url ? (
                    <BlurImage
                      src={restaurant.cover_image_url || restaurant.image_url || ""}
                      alt={restaurant.name || restaurant.shop_name}
                      fill
                      className="h-full w-full"
                      sizes="112px"
                      fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-3xl">
                      🍽️
                    </div>
                  )}
                  {restaurant.is_new && (
                    <span className="absolute top-1.5 left-1.5 rounded-md bg-green-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                      {t.home.new}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-on-surface truncate text-sm font-bold">
                        {restaurant.name || restaurant.shop_name}
                      </h3>
                      <p className="text-on-surface-variant mt-0.5 truncate text-[11px]">
                        {restaurant.cuisine || t.home.various}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-0.5 rounded-lg bg-green-500/10 px-2 py-1">
                      <span className="text-[11px] font-black text-green-600">
                        {restaurant.rating || 4.0}
                      </span>
                      <span className="text-[10px] text-green-600">★</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-on-surface-variant flex items-center gap-1 text-[11px]">
                      <span className="material-symbols-outlined text-accent text-[12px]">
                        schedule
                      </span>
                      {restaurant.delivery_time_min || 25}–{restaurant.delivery_time_max || 35} min
                    </span>
                    {restaurant.delivery_charge !== undefined &&
                      restaurant.delivery_charge !== null && (
                        <span
                          className={`text-[11px] font-bold ${Number(restaurant.delivery_charge) === 0 ? "text-green-600" : "text-on-surface-variant"}`}
                        >
                          {Number(restaurant.delivery_charge) === 0
                            ? "Free delivery"
                            : `₹${restaurant.delivery_charge}`}
                        </span>
                      )}
                    {restaurant.min_order_amount && (
                      <span className="text-on-surface-variant/60 text-[10px]">
                        Min ₹{restaurant.min_order_amount}
                      </span>
                    )}
                  </div>
                  {idx < 2 && restaurant.is_featured && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-[12px] text-amber-500"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="text-[10px] font-bold text-amber-600">
                        {t.home.topRated}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : !hasPincode ? (
        <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-8 text-center shadow-sm">
          <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            <span className="material-symbols-outlined text-accent text-4xl">location_on</span>
          </div>
          <h3 className="text-on-surface mb-1 text-lg font-bold">{t.home.locationRequired}</h3>
          <p className="text-on-surface-variant mb-5 text-sm">{t.home.locationRequiredDesc}</p>
          <button
            onClick={onLocationClick}
            className="bg-primary text-on-primary rounded-xl px-6 py-3 text-sm font-bold shadow-md transition-all hover:bg-[#e5b62e] active:scale-95"
          >
            {t.home.selectPincode}
          </button>
        </div>
      ) : hasPincode ? (
        <div className="bg-surface-container-lowest border-outline-variant/10 rounded-2xl border p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            <span className="material-symbols-outlined text-4xl text-amber-500">location_off</span>
          </div>
          <h3 className="text-on-surface mb-1 text-lg font-bold">{t.home.notAvailable}</h3>
          <p className="text-on-surface-variant mb-1 text-sm">{t.home.notAvailableDesc}</p>
          <p className="text-accent mb-4 text-sm font-bold">{displayAddress}</p>
          <p className="mb-5 text-xs text-[var(--color-outline-variant)]">{t.home.expanding}</p>
          <button
            onClick={onLocationClick}
            className="bg-primary text-on-primary rounded-xl px-6 py-3 text-sm font-bold"
          >
            {t.home.changeLocation}
          </button>
        </div>
      ) : (
        <div className="text-on-surface-variant/70 py-8 text-center">
          <span className="material-symbols-outlined mb-2 text-4xl">restaurant</span>
          <p>{t.home.noRestaurantsNearby}</p>
        </div>
      )}
    </div>
  );
}
