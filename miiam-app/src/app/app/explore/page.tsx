"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import dynamic from "next/dynamic";
import PullToRefresh from "@/components/PullToRefresh";
import QuickActionsFAB from "@/components/QuickActionsFAB";
import BlurImage from "@/components/BlurImage";
import { useCartStore } from "@/lib/store/cartStore";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

const OnboardingTour = dynamic(() => import("@/components/OnboardingTour"), { ssr: false });
const StaggerContainer = dynamic(() => import("@/components/ui/AnimationWrappers").then(m => m.StaggerContainer), { ssr: false });
const StaggerItem = dynamic(() => import("@/components/ui/AnimationWrappers").then(m => m.StaggerItem), { ssr: false });
const FadeIn = dynamic(() => import("@/components/ui/AnimationWrappers").then(m => m.FadeIn), { ssr: false });

const categories = [
  { id: "all", icon: "apps", label: "All" },
  { id: "food", icon: "restaurant", label: "Food" },
  { id: "grocery", icon: "shopping_basket", label: "Grocery" },
  { id: "beauty", icon: "spa", label: "Beauty" },
  { id: "services", icon: "handyman", label: "Services" },
  { id: "printing", icon: "print", label: "Printing" },
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

const servicesData = [
  { id: "food", name: "Food Delivery", desc: "Order from top restaurants", icon: "restaurant", price: null, rating: 4.5, dietary: "both", cuisine: "multi" },
  { id: "grocery", name: "Grocery", desc: "Fresh groceries delivered", icon: "shopping_basket", price: null, rating: 4.3, dietary: "both", cuisine: "grocery" },
  { id: "beauty", name: "Beauty & Spa", desc: "Salon, Spa, Nails", icon: "spa", price: 299, rating: 4.7, dietary: "both", cuisine: "beauty" },
  { id: "services", name: "Home Services", desc: "AC, Plumbing, Cleaning", icon: "handyman", price: 199, rating: 4.4, dietary: "both", cuisine: "services" },
  { id: "printing", name: "Printing", desc: "Print docs, photos & more", icon: "print", price: 5, rating: 4.7, dietary: "both", cuisine: "printing" },
  { id: "cleaning", name: "Cleaning", desc: "Home & Office Cleaning", icon: "cleaning_services", price: 499, rating: 4.6, dietary: "both", cuisine: "cleaning" },
  { id: "ac", name: "AC Repair", desc: "AC Repair & Service", icon: "ac_unit", price: 299, rating: 4.7, dietary: "both", cuisine: "ac" },
  { id: "plumbing", name: "Plumbing", desc: "Pipe & Leak Repair", icon: "plumbing", price: 149, rating: 4.5, dietary: "both", cuisine: "plumbing" },
  { id: "electrical", name: "Electrical", desc: "Wiring & Switches", icon: "electrical_services", price: 99, rating: 4.4, dietary: "both", cuisine: "electrical" },
  { id: "pest", name: "Pest Control", desc: "Cockroach & Pest Control", icon: "pest_control", price: 399, rating: 4.3, dietary: "both", cuisine: "pest" },
];

export default function ExplorePage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState<"all" | "under_200" | "200_500" | "over_500">("all");
  const [ratingFilter, setRatingFilter] = useState<"all" | "4plus" | "3plus">("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [cartBounce, setCartBounce] = useState(false);
  const [prevCartCount, setPrevCartCount] = useState(0);
  const [showLocationBanner, setShowLocationBanner] = useState(false);
  const [dismissedLocationBanner, setDismissedLocationBanner] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const filteredServices = servicesData.filter(service => {
    const matchesSearch = searchQuery === "" || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === "all" || service.id === activeCategory;
    
    const matchesPrice = priceFilter === "all" || 
      (priceFilter === "under_200" && service.price && service.price < 200) ||
      (priceFilter === "200_500" && service.price && service.price >= 200 && service.price <= 500) ||
      (priceFilter === "over_500" && service.price && service.price > 500) ||
      service.price === null;
    
    const matchesRating = ratingFilter === "all" ||
      (ratingFilter === "4plus" && service.rating >= 4) ||
      (ratingFilter === "3plus" && service.rating >= 3);
    
    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });

  const hasActiveFilters = priceFilter !== "all" || ratingFilter !== "all";

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    async function checkLocation() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: profile } = await supabase
            .from("profiles")
            .select("city, state")
            .eq("id", session.user.id)
            .maybeSingle();
        if (profile && !profile.city && !dismissedLocationBanner) {
          setShowLocationBanner(true);
        }
      } catch (err) {
        logger.error({ err: err }, "Failed to check location");
      }
    }
    checkLocation();
  }, [dismissedLocationBanner]);

  useEffect(() => {
    if (cartCount > prevCartCount && cartCount > 0) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 500);
      setPrevCartCount(cartCount);
      return () => clearTimeout(timer);
    }
    setPrevCartCount(cartCount);
  }, [cartCount, prevCartCount]);

  const handleRefresh = async () => {
    try {
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 1500));
      window.location.reload();
    } catch {
      setError("Failed to refresh. Please try again.");
    }
  };

  const colorMap: Record<string, string> = {
    all: "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]",
    food: "bg-orange-100 text-orange-600",
    grocery: "bg-green-100 text-green-600",
    beauty: "bg-pink-100 text-pink-600",
    services: "bg-blue-100 text-blue-600",
    printing: "bg-indigo-100 text-indigo-600",
    cleaning: "bg-cyan-100 text-cyan-600",
    ac: "bg-sky-100 text-sky-600",
    plumbing: "bg-teal-100 text-teal-600",
    electrical: "bg-amber-100 text-amber-600",
    pest: "bg-lime-100 text-lime-600",
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-surface dark:bg-[var(--color-surface)] flex items-center justify-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-3xl text-white">M</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[var(--color-surface)] text-on-background dark:text-[var(--color-on-surface)]">
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error" className="ml-auto text-red-500">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
      {showLocationBanner && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600">location_on</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">{t.home.selectLocation}</p>
            <p className="text-xs text-amber-700">{t.home.notAvailableDesc}</p>
          </div>
          <Link
            href="/auth/profile-setup?redirect=/app/explore"
            className="text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
          >
            {t.home.changeLocation}
          </Link>
          <button
            onClick={() => { setShowLocationBanner(false); setDismissedLocationBanner(true); }}
            aria-label="Dismiss location banner"
            className="text-amber-500"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
      <PullToRefresh onRefresh={handleRefresh} className="pb-24">
        {/* Header */}
        <header className="bg-surface-container dark:bg-[var(--color-surface-container)] px-6 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-on-surface dark:text-[var(--color-on-surface)]">Explore</h1>
              <p className="text-on-surface-variant/70 dark:text-[var(--color-outline)]/70">Discover everything MIIAM has to offer</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Cart with animated badge */}
              <Link 
                href="/app/cart" 
                aria-label={`Cart (${cartCount} items)`}
                className={`relative p-2 bg-surface-container-high dark:bg-[var(--color-surface-container-high)] rounded-full hover:bg-surface-container-highest transition-colors ${cartBounce ? "animate-bounce-sm" : ""}`}
              >
                <span className="material-symbols-outlined text-2xl text-on-surface-variant dark:text-[var(--color-outline)]" aria-hidden="true">shopping_cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce-in">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
              {/* Notifications */}
              <button
                onClick={() => { localStorage.removeItem("miiam_onboarding_tour_done"); window.location.reload(); }}
                aria-label="Take a tour"
                className="p-2 bg-surface-container-high dark:bg-[var(--color-surface-container-high)] rounded-full hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-2xl text-on-surface-variant dark:text-[var(--color-outline)]">help_outline</span>
              </button>
              <Link href="/app/notifications" aria-label="Notifications" className="p-2 bg-surface-container-high dark:bg-[var(--color-surface-container-high)] rounded-full hover:bg-surface-container-highest transition-colors relative">
                <span className="material-symbols-outlined text-2xl text-on-surface-variant dark:text-[var(--color-outline)]" aria-hidden="true">notifications</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 dark:text-[var(--color-outline)]/60">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.home.searchPlaceholder}
              className="w-full pl-12 pr-4 py-4 bg-surface-container-high dark:bg-[var(--color-surface-container-high)] rounded-2xl text-on-surface dark:text-[var(--color-on-surface)] placeholder-on-surface-variant/50 dark:placeholder-[var(--color-outline)]/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </header>

        <main className="space-y-8">
        {/* Swipeable Category Tabs */}
        <section className="sticky top-0 z-20 bg-surface-container/85 dark:bg-[var(--color-surface-container)]/85 backdrop-blur-xl border-b border-outline-variant/10 dark:border-b-[var(--color-border-subtle)]/10">
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
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105' 
                    : 'bg-surface-container dark:bg-[var(--color-surface-container)] text-on-surface-variant dark:text-[var(--color-outline)] hover:bg-surface-container-high dark:hover:bg-[var(--color-surface-container-high)] hover:scale-[1.02]'}
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
            <span className="text-sm text-on-surface-variant/70 dark:text-[var(--color-outline)]/70">Showing:</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colorMap[activeCategory]}`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{categories.find(c => c.id === activeCategory)?.icon}</span>
              {categories.find(c => c.id === activeCategory)?.label}
            </span>
            <button 
              onClick={() => setActiveCategory("all")}
              className="text-xs text-primary font-bold hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Search and Filter Bar */}
        <section className="px-6 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm ${
                hasActiveFilters ? "bg-primary text-white" : "bg-surface-container dark:bg-[var(--color-surface-container)] text-on-surface-variant dark:text-[var(--color-outline)] border border-outline-variant/20 dark:border-[var(--color-border-subtle)]/20 hover:bg-surface-container-high dark:hover:bg-[var(--color-surface-container-high)]"
              }`}
            >
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Filters
              {hasActiveFilters && <span className="w-2 h-2 bg-[var(--color-surface-container-lowest)] rounded-full" />}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-surface-container dark:bg-[var(--color-surface-container)] rounded-2xl border border-outline-variant/10 dark:border-[var(--color-border-subtle)]/10 space-y-4 animate-fade-in">
              <div>
                <p className="text-xs font-bold text-on-surface-variant/70 uppercase mb-2">Price Range</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "all", label: "All" },
                    { value: "under_200", label: "Under ₹200" },
                    { value: "200_500", label: "₹200-500" },
                    { value: "over_500", label: "₹500+" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPriceFilter(opt.value as typeof priceFilter)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold ${
                        priceFilter === opt.value ? "bg-primary text-white" : "bg-surface-container-high dark:bg-[var(--color-surface-container-high)] text-on-surface-variant dark:text-[var(--color-outline)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-xs font-bold text-on-surface-variant/70 uppercase mb-2">Rating</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "all", label: "All" },
                    { value: "4plus", label: "4+ ★" },
                    { value: "3plus", label: "3+ ★" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRatingFilter(opt.value as typeof ratingFilter)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold ${
                        ratingFilter === opt.value ? "bg-primary text-white" : "bg-surface-container-high dark:bg-[var(--color-surface-container-high)] text-on-surface-variant dark:text-[var(--color-outline)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {hasActiveFilters && (
                <button
                  onClick={() => { setPriceFilter("all"); setRatingFilter("all"); }}
                  className="text-xs text-primary font-bold"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* Results Count */}
        {(searchQuery || hasActiveFilters) && (
          <div className="px-6 mb-2">
              <p className="text-sm text-on-surface-variant/70 dark:text-[var(--color-outline)]/70">
              {filteredServices.length} {filteredServices.length === 1 ? "result" : "results"} found
            </p>
          </div>
        )}

        {/* Services Grid */}
        <section className="px-6">
          <h2 className="text-lg font-black text-on-surface dark:text-[var(--color-on-surface)] mb-4">
            {activeCategory === "all" ? t.nav.services : categories.find(c => c.id === activeCategory)?.label}
          </h2>
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">search_off</span>
              <p className="text-on-surface-variant/70 mt-4">{t.common.noResults}</p>
              <button 
                onClick={() => { setSearchQuery(""); setActiveCategory("all"); setPriceFilter("all"); setRatingFilter("all"); }}
                className="text-primary font-bold text-sm mt-2"
              >
                Clear filters
              </button>
            </div>
          ) : (
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredServices.map((feature, i) => (
              <StaggerItem key={feature.id}>
              <Link 
                href={`/app/${feature.id}`}
                className={`bg-surface-container-lowest dark:bg-[var(--color-surface-container-lowest)] border border-outline-variant/10 dark:border-[var(--color-border-subtle)]/10 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all group card-lift ${
                  activeCategory !== "all" && activeCategory !== feature.id ? "opacity-40 scale-95" : ""
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl ${colorMap[feature.id]} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
                </div>
                <h3 className="font-bold text-on-surface dark:text-[var(--color-on-surface)]">{feature.name}</h3>
                <p className="text-xs text-on-surface-variant dark:text-[var(--color-outline)] mt-1">
                  {feature.id === "food" && "Order from top restaurants"}
                  {feature.id === "grocery" && "Fresh groceries delivered"}
                  {feature.id === "beauty" && "Salon, Spa, Nails"}
                  {feature.id === "services" && "AC, Plumbing, Cleaning"}
                  {feature.id === "printing" && "Print docs, photos & more"}
                  {feature.id === "cleaning" && "Home & Office Cleaning"}
                  {feature.id === "ac" && "AC Repair & Service"}
                  {feature.id === "plumbing" && "Pipe & Leak Repair"}
                  {feature.id === "electrical" && "Wiring & Switches"}
                  {feature.id === "pest" && "Cockroach & Pest Control"}
                </p>
              </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
          )}
        </section>

        {/* Collections */}
        <section>
          <h2 className="text-lg font-black text-on-surface dark:text-[var(--color-on-surface)] mb-4">Featured Collections</h2>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" staggerDelay={0.08}>
            {collections.map((collection, i) => (
              <StaggerItem key={collection.id}>
              <div 
                className="relative rounded-2xl overflow-hidden h-40 group card-lift"
              >
                <BlurImage 
                  src={collection.image} 
                  alt={collection.name} 
                  fill
                  className="w-full h-full group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xl mb-1">{collection.emoji}</p>
                  <h3 className="font-black text-white text-lg">{collection.name}</h3>
                  <p className="text-xs text-white/70">{collection.count} places</p>
                </div>
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Become a Partner CTA */}
        <FadeIn>
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-[var(--color-surface-container-lowest)]/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">store</span>
            </div>
            <div>
              <h3 className="font-black text-xl">Partner with MIIAM</h3>
              <p className="text-sm text-white/70">Grow your business with us</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-4">Join 10,000+ restaurants and service providers earning with MIIAM.</p>
          <a href="https://partner.miiam.in" target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] font-bold rounded-xl hover:bg-[var(--color-surface-container)] transition-colors text-center">
            Register Your Business
          </a>
        </div>
        </FadeIn>

        {/* Download App CTA */}
        <FadeIn delay={0.1}>
        <div className="bg-primary rounded-2xl p-6 text-white text-center">
          <h3 className="font-black text-2xl mb-2">Download MIIAM App</h3>
          <p className="text-sm text-white/80 mb-4">Get exclusive deals and faster ordering</p>
          <div className="flex gap-3 justify-center">
            <a href="https://apps.apple.com/app/miiam" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[var(--color-surface-container-lowest)]/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
              <span className="text-2xl">🍎</span>
              <span className="font-bold text-sm">App Store</span>
            </a>
            <a href="https://play.google.com/store/apps/details?id=in.miiam.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[var(--color-surface-container-lowest)]/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
              <span className="text-2xl">🤖</span>
              <span className="font-bold text-sm">Play Store</span>
            </a>
          </div>
        </div>
        </FadeIn>
        </main>
      </PullToRefresh>
      
      <QuickActionsFAB />
      <OnboardingTour />
    </div>
  );
}