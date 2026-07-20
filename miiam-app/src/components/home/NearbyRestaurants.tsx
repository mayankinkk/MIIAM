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

export default function NearbyRestaurants({ restaurants, hasLocation, hasPincode, displayAddress, onLocationClick }: NearbyRestaurantsProps) {
  const { t } = useTranslation();
  const foodRestaurants = restaurants.filter(r => r.type === 'food' || r.type === 'restaurant');

  return (
    <div className="px-5 pb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-black text-on-surface">{t.home.nearbyPopular}</h2>
          <p className="text-[11px] text-on-surface-variant mt-0.5">{foodRestaurants.length} restaurants nearby</p>
        </div>
        <Link href="/app/food" className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">{t.home.seeAll}</Link>
      </div>
      {foodRestaurants.length > 0 ? (
        <div className="space-y-3">
          {foodRestaurants.slice(0, 8).map((restaurant, idx) => (
            <Link key={restaurant.id} href={`/app/vendor/${restaurant.id}`} className="block bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 active:scale-[0.98] transition-transform">
              <div className="flex">
                <div className="w-28 h-28 flex-shrink-0 bg-surface-container relative overflow-hidden">
                  {restaurant.cover_image_url || restaurant.image_url ? (
                    <BlurImage src={restaurant.cover_image_url || restaurant.image_url || ""} alt={restaurant.name || restaurant.shop_name} fill className="w-full h-full" sizes="112px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-orange-100 to-amber-50">🍽️</div>
                  )}
                  {restaurant.is_new && (
                    <span className="absolute top-1.5 left-1.5 bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">{t.home.new}</span>
                  )}
                </div>
                <div className="p-3 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-on-surface truncate">{restaurant.name || restaurant.shop_name}</h3>
                      <p className="text-[11px] text-on-surface-variant truncate mt-0.5">{restaurant.cuisine || t.home.various}</p>
                    </div>
                    <div className="flex items-center gap-0.5 bg-green-500/10 px-2 py-1 rounded-lg flex-shrink-0">
                      <span className="text-[11px] font-black text-green-600">{restaurant.rating || 4.0}</span>
                      <span className="text-green-600 text-[10px]">★</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-[12px] text-primary">schedule</span>
                      {restaurant.delivery_time_min || 25}–{restaurant.delivery_time_max || 35} min
                    </span>
                    {restaurant.delivery_charge !== undefined && restaurant.delivery_charge !== null && (
                      <span className={`text-[11px] font-bold ${Number(restaurant.delivery_charge) === 0 ? "text-green-600" : "text-on-surface-variant"}`}>
                        {Number(restaurant.delivery_charge) === 0 ? "Free delivery" : `₹${restaurant.delivery_charge}`}
                      </span>
                    )}
                    {restaurant.min_order_amount && (
                      <span className="text-[10px] text-on-surface-variant/60">Min ₹{restaurant.min_order_amount}</span>
                    )}
                  </div>
                  {idx < 2 && restaurant.is_featured && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="material-symbols-outlined text-[12px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-[10px] font-bold text-amber-600">{t.home.topRated}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : !hasPincode ? (
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-primary">location_on</span>
          </div>
          <h3 className="text-lg font-black text-on-surface mb-1">{t.home.locationRequired}</h3>
          <p className="text-sm text-on-surface-variant mb-5">{t.home.locationRequiredDesc}</p>
          <button
            onClick={onLocationClick}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-[#a00018] active:scale-95 transition-all shadow-md"
          >
            {t.home.selectPincode}
          </button>
        </div>
      ) : hasPincode ? (
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-amber-500">location_off</span>
          </div>
          <h3 className="text-lg font-black text-on-surface mb-1">{t.home.notAvailable}</h3>
          <p className="text-sm text-on-surface-variant mb-1">{t.home.notAvailableDesc}</p>
          <p className="text-sm font-bold text-primary mb-4">{displayAddress}</p>
          <p className="text-xs text-[var(--color-outline-variant)] mb-5">{t.home.expanding}</p>
          <button
            onClick={onLocationClick}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm"
          >
            {t.home.changeLocation}
          </button>
        </div>
      ) : (
        <div className="text-center py-8 text-on-surface-variant/70">
          <span className="material-symbols-outlined text-4xl mb-2">restaurant</span>
          <p>{t.home.noRestaurantsNearby}</p>
        </div>
      )}
    </div>
  );
}
