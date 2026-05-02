"use client";

import Link from "next/link";
import { useFavoritesStore } from "@/lib/store/favoritesStore";

const allFavoriteVendors = [
  { id: "r1", name: "The Burger Alchemist", category: "Food", rating: 4.9, delivery_time_min: 20, delivery_time_max: 30, image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80" },
  { id: "r2", name: "Sushi Zen Master", category: "Food", rating: 4.8, delivery_time_min: 20, delivery_time_max: 30, image_url: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&q=80" },
  { id: "r3", name: "PureHome Cleaning", category: "Cleaning", rating: 4.7, delivery_time_min: 0, delivery_time_max: 0, image_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80" },
  { id: "r4", name: "Pizzeria d'Autore", category: "Food", rating: 4.9, delivery_time_min: 15, delivery_time_max: 20, image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80" },
  { id: "r5", name: "Spice Garden", category: "Food", rating: 4.6, delivery_time_min: 30, delivery_time_max: 40, image_url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80" },
  { id: "r6", name: "QuickFix Electrician", category: "Tech", rating: 4.5, delivery_time_min: 0, delivery_time_max: 0, image_url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80" },
  { id: "s1", name: "Salon for Women", category: "Services", rating: 4.8, delivery_time_min: 0, delivery_time_max: 0, image_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80" },
];

export default function FavoritesPage() {
  const { favoriteIds, toggle } = useFavoritesStore();
  const favorites = allFavoriteVendors.filter((v) => favoriteIds.includes(v.id));

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

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="text-8xl mb-6">🤍</div>
            <h2 className="text-2xl font-bold text-[#4d212a] mb-3">No favourites yet</h2>
            <p className="text-[#814c55] mb-8">Tap the ❤️ heart on any vendor to save it here.</p>
            <Link
              href="/app/explore"
              className="bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white px-10 py-4 rounded-xl font-bold inline-block hover:scale-105 transition-transform shadow-lg shadow-[#ba001c]/20"
            >
              Explore Vendors
            </Link>
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
                        <h3 className="font-bold text-[#4d212a] text-lg">{vendor.name}</h3>
                        <span className="text-xs bg-[#ff7670]/20 text-[#4e0006] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{vendor.category}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-[#4d212a]">
                        <span className="material-symbols-outlined text-[#ba001c] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {vendor.rating.toFixed(1)}
                      </div>
                    </div>
                    <p className="text-xs text-[#814c55] mt-2">
                      {vendor.delivery_time_max > 0 ? `${vendor.delivery_time_min}–${vendor.delivery_time_max} mins` : "Scheduled Service"}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => toggle(vendor.id)}
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
