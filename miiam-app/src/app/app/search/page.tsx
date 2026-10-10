"use client";

import { useState, useEffect, useRef, Suspense, useMemo, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import { Skeleton, VendorCardSkeleton, SearchResultSkeleton } from "@/components/Skeleton";
import logger from "@/lib/logger";
import { EmptySearch } from "@/components/ui/EmptyStates";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import VegFilterPill from "@/components/VegFilterPill";

function RecentSearches({ onSelect }: { onSelect: (term: string) => void }) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem("miiam-search-history") || "[]"));
    } catch {
      /* ignore */
    }
  }, []);

  if (recent.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-on-surface-variant text-sm font-bold">Recent Searches</h3>
        <button
          onClick={() => {
            localStorage.removeItem("miiam-search-history");
            setRecent([]);
          }}
          className="text-accent text-xs font-bold"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {recent.map((term) => (
          <button
            key={term}
            onClick={() => onSelect(term)}
            className="bg-surface-container text-on-surface-variant hover:bg-surface-container-high flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">history</span>
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

interface VendorResult {
  id: string;
  shop_name: string;
  cuisine: string;
  rating: number;
  delivery_time_min: number;
  delivery_time_max: number;
  min_order_amount: number;
  image_url: string | null;
  cover_image_url?: string | null;
}

interface MenuResult {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  is_veg: boolean | null;
  vendor: VendorResult;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const supabase = useMemo(() => createClient(), []);
  const { addItem } = useCartStore();
  const { addToast } = useToastStore();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ vendors: VendorResult[]; menuItems: MenuResult[] }>({
    vendors: [],
    menuItems: [],
  });
  const [activeTab, setActiveTab] = useState<"all" | "vendors" | "food">("all");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non_veg">("all");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(query);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("miiam-search-history");
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {
        /* corrupted data, ignore */
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q") || "";
      setInputValue(q);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (inputValue !== query) {
        const url = new URL(window.location.href);
        url.searchParams.set("q", inputValue);
        window.history.replaceState({}, "", url);
        router.replace(url.pathname + url.search, { scroll: false });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...searchHistory.filter((t) => t !== term)].slice(0, 10);
    setSearchHistory(updated);
    localStorage.setItem("miiam-search-history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("miiam-search-history");
  };

  const search = useCallback(
    async (searchQuery: string) => {
      setLoading(true);
      try {
        const searchTerm = `%${searchQuery.toLowerCase()}%`;

        const [vendorsRes, menuRes] = await Promise.all([
          supabase
            .from("vendors")
            .select(
              "id, shop_name, name, cuisine, image_url, cover_image_url, rating, review_count, delivery_time_min, delivery_time_max, delivery_charge, min_order_amount, is_featured, status, type, pincode, city"
            )
            .or(`shop_name.ilike.${searchTerm},cuisine.ilike.${searchTerm}`)
            .eq("status", "active")
            .limit(20),
          supabase
            .from("menu_items")
            .select(
              "id, vendor_id, name, price, category, image_url, is_veg, is_available, vendor:vendors(id, shop_name, image_url, cover_image_url)"
            )
            .ilike("name", `%${searchQuery}%`)
            .limit(20),
        ]);

        setResults({
          vendors: (vendorsRes.data || []) as VendorResult[],
          menuItems: (menuRes.data || []) as MenuResult[],
        });
      } catch (error) {
        logger.error(
          { err: error instanceof Error ? error : new Error(String(error)) },
          "Search error"
        );
        addToast("Search failed. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    },
    [supabase, addToast]
  );

  useEffect(() => {
    if (!query.trim()) {
      setResults({ vendors: [], menuItems: [] });
      return;
    }
    saveSearch(query);
    search(query);
  }, [query, search]);

  const handleAddToCart = (item: MenuResult) => {
    addItem({
      id: item.id,
      menu_item_id: item.id,
      vendor_id: item.vendor.id,
      vendor_name: item.vendor?.shop_name || "Vendor",
      name: item.name,
      price: item.price,
      image_url: item.image_url || undefined,
    });
  };

  const filteredResults = {
    vendors: activeTab === "food" ? [] : results.vendors,
    menuItems:
      activeTab === "vendors"
        ? []
        : results.menuItems.filter(
            (m) => vegFilter === "all" || m.is_veg === (vegFilter === "veg")
          ),
  };

  const totalResults = filteredResults.vendors.length + filteredResults.menuItems.length;

  return (
    <>
      <header className="bg-surface/80 border-outline-variant/20 fixed top-0 z-50 w-full border-b px-6 py-4 backdrop-blur-2xl dark:bg-[var(--color-surface)]/80">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Link href="/app/home" aria-label="Go back" className="text-accent">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-on-surface-variant absolute top-1/2 left-4 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={inputValue}
              placeholder="Search restaurants, dishes..."
              className="text-on-surface focus:ring-primary/40 w-full rounded-xl border-none bg-[var(--color-surface-container-lowest)] py-3 pr-4 pl-12 font-medium focus:ring-2 focus:outline-none dark:bg-[var(--color-surface-container-lowest)]"
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const url = new URL(window.location.href);
                  url.searchParams.set("q", inputValue);
                  window.history.replaceState({}, "", url);
                  router.replace(url.pathname + url.search, { scroll: false });
                }
              }}
            />
          </div>
        </div>
      </header>

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Search" }]} />

      <main className="mx-auto max-w-4xl px-6 pt-24 pb-24">
        {!query && (
          <div className="mb-6">
            <RecentSearches
              onSelect={(term) => {
                setInputValue(term);
                const url = new URL(window.location.href);
                url.searchParams.set("q", term);
                window.history.replaceState({}, "", url);
                router.replace(url.pathname + url.search, { scroll: false });
              }}
            />
          </div>
        )}
        {query && (
          <div className="mb-6 flex flex-wrap gap-2">
            <div className="flex gap-2">
              {(["all", "vendors", "food"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    activeTab === tab
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant border-outline-variant/30 border bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container-lowest)]"
                  }`}
                >
                  {tab === "all" ? "All" : tab === "vendors" ? "Restaurants" : "Dishes"}
                </button>
              ))}
            </div>
            {activeTab !== "vendors" && (
              <VegFilterPill value={vegFilter} onChange={setVegFilter} size="sm" />
            )}
          </div>
        )}

        {loading ? (
          <SearchResultSkeleton />
        ) : !query ? (
          <div className="py-8">
            {searchHistory.length > 0 && (
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-on-surface text-lg font-bold">Recent Searches</h2>
                  <button onClick={clearHistory} className="text-accent text-xs font-bold">
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((term) => (
                    <Link
                      key={term}
                      href={`/app/search?q=${term}`}
                      className="text-on-surface-variant border-outline-variant/30 hover:border-primary flex items-center gap-2 rounded-full border bg-[var(--color-surface-container-lowest)] px-4 py-2 text-sm transition-all dark:bg-[var(--color-surface-container-lowest)]"
                    >
                      <span className="material-symbols-outlined text-sm">history</span>
                      {term}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="py-8 text-center">
              <span className="text-6xl">🔍</span>
              <h2 className="text-on-surface mt-4 text-xl font-bold">Search for anything</h2>
              <p className="text-on-surface-variant mt-2">Find restaurants, dishes, cuisines</p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {["Biryani", "Pizza", "Burgers", "Chinese", "South Indian", "Desserts"].map(
                  (tag) => (
                    <Link
                      key={tag}
                      href={`/app/search?q=${tag}`}
                      className="text-on-surface-variant border-outline-variant/30 hover:border-primary rounded-full border bg-[var(--color-surface-container-lowest)] px-4 py-2 text-sm transition-all dark:bg-[var(--color-surface-container-lowest)]"
                    >
                      {tag}
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        ) : totalResults === 0 ? (
          <div className="animate-fade-in">
            <EmptySearch query={query} />
            <div className="mt-8 text-center">
              <p className="text-on-surface-variant mb-4 text-sm">Popular searches</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "Biryani",
                  "Pizza",
                  "Burgers",
                  "Chinese",
                  "South Indian",
                  "Desserts",
                  "North Indian",
                  "Street Food",
                ].map((tag) => (
                  <Link
                    key={tag}
                    href={`/app/search?q=${tag}`}
                    className="text-on-surface-variant border-outline-variant/30 hover:border-primary hover:bg-primary hover:text-on-primary/5 rounded-full border bg-[var(--color-surface-container-lowest)] px-4 py-2 text-sm transition-all dark:bg-[var(--color-surface-container-lowest)]"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {filteredResults.vendors.length > 0 && (
              <section className="mb-8">
                <h3 className="text-on-surface mb-4 text-lg font-bold">
                  Restaurants ({filteredResults.vendors.length})
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredResults.vendors.map((vendor) => (
                    <Link
                      key={vendor.id}
                      href={`/app/vendor/${vendor.id}`}
                      className="bg-surface-container-lowest border-outline-variant/20 overflow-hidden rounded-2xl border transition-all hover:shadow-lg dark:bg-[var(--color-surface-container-lowest)]"
                    >
                      <div className="bg-surface-container relative h-32 dark:bg-[var(--color-surface-container)]">
                        {vendor.cover_image_url || vendor.image_url ? (
                          <BlurImage
                            src={vendor.cover_image_url || vendor.image_url || ""}
                            alt={vendor.shop_name}
                            fill
                            className="h-full w-full"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="material-symbols-outlined text-outline-variant text-4xl">
                              restaurant
                            </span>
                          </div>
                        )}
                        <div className="text-on-surface absolute bottom-2 left-2 rounded-lg bg-[var(--color-surface-container-lowest)]/90 px-2 py-1 text-xs font-bold backdrop-blur dark:bg-[var(--color-surface-container-lowest)]/90">
                          ⭐ {vendor.rating?.toFixed(1) || "N/A"}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-on-surface font-bold">{vendor.shop_name}</h4>
                        <p className="text-on-surface-variant text-sm">{vendor.cuisine}</p>
                        <p className="text-on-surface-variant mt-1 text-xs">
                          {vendor.delivery_time_min}-{vendor.delivery_time_max} min • ₹
                          {vendor.min_order_amount} min
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {filteredResults.menuItems.length > 0 && (
              <section>
                <h3 className="text-on-surface mb-4 text-lg font-bold">
                  Dishes ({filteredResults.menuItems.length})
                </h3>
                <div className="space-y-3">
                  {filteredResults.menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-surface-container-lowest border-outline-variant/20 flex items-center gap-4 rounded-2xl border p-4 dark:bg-[var(--color-surface-container-lowest)]"
                    >
                      <div className="bg-surface-container h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg dark:bg-[var(--color-surface-container)]">
                        {item.image_url ? (
                          <BlurImage
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="h-full w-full"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="material-symbols-outlined text-outline-variant text-2xl">
                              fastfood
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-3.5 w-3.5 border-2 ${item.is_veg ? "border-green-600" : "border-red-600"} flex items-center justify-center rounded-sm`}
                          >
                            <span
                              className={`h-1.5 w-1.5 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`}
                            ></span>
                          </span>
                          <h4 className="text-on-surface truncate font-bold">{item.name}</h4>
                        </div>
                        <p className="text-on-surface-variant text-sm">{item.vendor?.shop_name}</p>
                        <p className="text-on-surface mt-1 text-sm font-bold">₹{item.price}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(item);
                        }}
                        aria-label="Add to cart"
                        className="bg-primary text-on-primary rounded-lg p-2 transition-all hover:bg-[#e5b62e]"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface flex min-h-screen items-center justify-center dark:bg-[var(--color-surface)]">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
