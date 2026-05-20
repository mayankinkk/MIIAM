"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import PullToRefresh from "@/components/PullToRefresh";
import QuickActionsFAB from "@/components/QuickActionsFAB";
import { useCartStore } from "@/lib/store/cartStore";

const categories = [
  { id: "all", icon: "apps", label: "All" },
  { id: "food", icon: "restaurant", label: "Food" },
  { id: "grocery", icon: "shopping_basket", label: "Grocery" },
  { id: "beauty", icon: "spa", label: "Beauty" },
  { id: "services", icon: "handyman", label: "Services" },
  { id: "pharmacy", icon: "medication", label: "Pharmacy" },
  { id: "flowers", icon: "local_florist", label: "Flowers" },
  { id: "cleaning", icon: "cleaning_services", label: "Cleaning" },
  { id: "ac", icon: "ac_unit", label: "AC Repair" },
  { id: "plumbing", icon: "plumbing", label: "Plumbing" },
  { id: "electrical", icon: "electrical_services", label: "Electrical" },
  { id: "pest", icon: "pest_control", label: "Pest Control" },
];



const collections = [
  { id: "c1", name: "Budget Friendly", emoji: "💰", count: 45, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80" },
  { id: "c2", name: "Popular Picks", emoji: "🔥", count: 32, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80" },
  { id: "c3", name: "Healthy Eats", emoji: "🥗", count: 28, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80" },
  { id: "c4", name: "Late Night Cravings", emoji: "🌙", count: 21, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80" },
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { totalItems } = useCartStore();
  const [cartBounce, setCartBounce] = useState(false);
  const [prevCartCount, setPrevCartCount] = useState(0);

  useEffect(() => {
    // Ensure client-side rendering is complete
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const count = totalItems();
    if (count > prevCartCount && count > 0) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevCartCount(count);
  }, [totalItems(), prevCartCount]);

  const handleRefresh = async () => {
    try {
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setRefreshKey(k => k + 1);
    } catch (err) {
      setError("Failed to refresh. Please try again.");
    }
  };

  const colorMap: Record<string, string> = {
    all: "bg-slate-100 text-slate-600",
    food: "bg-orange-100 text-orange-600",
    grocery: "bg-green-100 text-green-600",
    beauty: "bg-pink-100 text-pink-600",
    services: "bg-blue-100 text-blue-600",
    pharmacy: "bg-purple-100 text-purple-600",
    flowers: "bg-rose-100 text-rose-600",
    cleaning: "bg-cyan-100 text-cyan-600",
    ac: "bg-sky-100 text-sky-600",
    plumbing: "bg-teal-100 text-teal-600",
    electrical: "bg-amber-100 text-amber-600",
    pest: "bg-lime-100 text-lime-600",
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
        <div className="w-16 h-16 bg-[#ba001c] rounded-2xl flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-3xl text-white">M</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
      <PullToRefresh onRefresh={handleRefresh} className="pb-24">
        {/* Header */}
        <header className="bg-white px-6 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-[#4d212a]">Explore</h1>
              <p className="text-slate-500">Discover everything MIIAM has to offer</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Cart with animated badge */}
              <Link 
                href="/app/cart" 
                className={`relative p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors ${cartBounce ? "animate-bounce-sm" : ""}`}
              >
                <span className="material-symbols-outlined text-2xl text-slate-700">shopping_cart</span>
                {totalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ba001c] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce-in">
                    {totalItems()}
                  </span>
                )}
              </Link>
              {/* Notifications */}
              <Link href="/app/notifications" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors relative">
                <span className="material-symbols-outlined text-2xl text-slate-700">notifications</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for anything..."
              className="w-full pl-12 pr-4 py-4 bg-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
            />
          </div>
        </header>

        <main className="space-y-8">
        {/* Swipeable Category Tabs */}
        <section className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100">
          <div 
            ref={scrollRef}
            className="flex gap-2 px-6 py-4 overflow-x-auto no-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); if (navigator.vibrate) navigator.vibrate(10); }}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap
                  transition-all duration-300 snap-start active:scale-95 animate-category-slide
                  ${activeCategory === cat.id 
                    ? 'bg-[#ba001c] text-white shadow-lg shadow-[#ba001c]/25 scale-105' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-[1.02]'}
                `}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Active Category Filter Chip */}
        {activeCategory !== "all" && (
          <div className="px-6 flex items-center gap-2">
            <span className="text-sm text-slate-500">Showing:</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colorMap[activeCategory]}`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{categories.find(c => c.id === activeCategory)?.icon}</span>
              {categories.find(c => c.id === activeCategory)?.label}
            </span>
            <button 
              onClick={() => setActiveCategory("all")}
              className="text-xs text-[#ba001c] font-bold hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Services Grid */}
        <section className="px-6">
          <h2 className="text-lg font-black text-slate-800 mb-4">
            {activeCategory === "all" ? "All Services" : categories.find(c => c.id === activeCategory)?.label}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {categories.filter(c => c.id !== "all").map((feature, i) => (
              <Link 
                key={feature.id} 
                href={`/app/${feature.id}`}
                className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all group card-lift animate-pop-in ${
                  activeCategory !== "all" && activeCategory !== feature.id ? "opacity-40 scale-95" : ""
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl ${colorMap[feature.id]} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
                </div>
                <h3 className="font-bold text-slate-800">{feature.label}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {feature.id === "food" && "Order from top restaurants"}
                  {feature.id === "grocery" && "Fresh groceries delivered"}
                  {feature.id === "beauty" && "Salon, Spa, Nails"}
                  {feature.id === "services" && "AC, Plumbing, Cleaning"}
                  {feature.id === "pharmacy" && "Medicines at your door"}
                  {feature.id === "flowers" && "Send love & wishes"}
                  {feature.id === "cleaning" && "Home & Office Cleaning"}
                  {feature.id === "ac" && "AC Repair & Service"}
                  {feature.id === "plumbing" && "Pipe & Leak Repair"}
                  {feature.id === "electrical" && "Wiring & Switches"}
                  {feature.id === "pest" && "Cockroach & Pest Control"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Collections */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4">Featured Collections</h2>
          <div className="grid grid-cols-2 gap-4">
            {collections.map((collection, i) => (
              <div 
                key={collection.id}
                className="relative rounded-2xl overflow-hidden h-40 group card-lift animate-pop-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <img 
                  src={collection.image} 
                  alt={collection.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xl mb-1">{collection.emoji}</p>
                  <h3 className="font-black text-white text-lg">{collection.name}</h3>
                  <p className="text-xs text-white/70">{collection.count} places</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Become a Partner CTA */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">store</span>
            </div>
            <div>
              <h3 className="font-black text-xl">Partner with MIIAM</h3>
              <p className="text-sm text-white/70">Grow your business with us</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-4">Join 10,000+ restaurants and service providers earning with MIIAM.</p>
          <button className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">
            Register Your Business
          </button>
        </div>

        {/* Download App CTA */}
        <div className="bg-[#ba001c] rounded-2xl p-6 text-white text-center">
          <h3 className="font-black text-2xl mb-2">Download MIIAM App</h3>
          <p className="text-sm text-white/80 mb-4">Get exclusive deals and faster ordering</p>
          <div className="flex gap-3 justify-center">
            <button className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
              <span className="text-2xl">🍎</span>
              <span className="font-bold text-sm">App Store</span>
            </button>
            <button className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
              <span className="text-2xl">🤖</span>
              <span className="font-bold text-sm">Play Store</span>
            </button>
          </div>
        </div>
        </main>
      </PullToRefresh>
      
      <QuickActionsFAB />
    </div>
  );
}