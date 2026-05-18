"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { Skeleton, VendorCardSkeleton } from "@/components/Skeleton";
import { EmptySearch } from "@/components/ui/EmptyStates";

interface VendorResult {
  id: string;
  shop_name: string;
  cuisine: string;
  rating: number;
  delivery_time_min: number;
  delivery_time_max: number;
  min_order_amount: number;
  image_url: string | null;
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
  const query = searchParams.get("q") || "";
  const supabase = createClient();
  const { addItem } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ vendors: VendorResult[]; menuItems: MenuResult[] }>({
    vendors: [],
    menuItems: [],
  });
  const [activeTab, setActiveTab] = useState<"all" | "vendors" | "food">("all");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non_veg">("all");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("miiam-search-history");
    if (saved) setSearchHistory(JSON.parse(saved));
  }, []);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...searchHistory.filter(t => t !== term)].slice(0, 10);
    setSearchHistory(updated);
    localStorage.setItem("miiam-search-history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("miiam-search-history");
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults({ vendors: [], menuItems: [] });
      return;
    }
    saveSearch(query);
    search(query);
  }, [query]);

  const search = async (searchQuery: string) => {
    setLoading(true);
    try {
      const searchTerm = `%${searchQuery.toLowerCase()}%`;

      const [vendorsRes, menuRes] = await Promise.all([
        supabase
          .from("vendors")
          .select("*")
          .or(`shop_name.ilike.${searchTerm},cuisine.ilike.${searchTerm}`)
          .eq("status", "active")
          .limit(20),
        supabase
          .from("menu_items")
          .select("*, vendor:vendors(*)")
          .ilike("name", `%${searchQuery}%`)
          .limit(20),
      ]);

      setResults({
        vendors: (vendorsRes.data || []) as VendorResult[],
        menuItems: (menuRes.data || []) as MenuResult[],
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      menu_item_id: item.id,
      vendor_id: item.vendor_id,
      vendor_name: item.vendor?.shop_name || "Vendor",
      name: item.name,
      price: item.price,
      image_url: item.image_url || undefined,
    });
  };

  const filteredResults = {
    vendors: activeTab === "food" ? [] : results.vendors,
    menuItems: activeTab === "vendors" ? [] : results.menuItems.filter((m) => vegFilter === "all" || m.is_veg === (vegFilter === "veg")),
  };

  const totalResults = filteredResults.vendors.length + filteredResults.menuItems.length;

  return (
    <>
      <header className="fixed top-0 w-full z-50 px-6 py-4 bg-[#fff4f4]/80 backdrop-blur-2xl border-b border-[#dd9ca6]/20">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Link href="/app/explore" className="text-[#ba001c]">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#814c55]">search</span>
            <input
              type="text"
              defaultValue={query}
              placeholder="Search restaurants, dishes..."
              className="w-full bg-white border-none rounded-xl pl-12 pr-4 py-3 text-[#4d212a] font-medium focus:outline-none focus:ring-2 focus:ring-[#ba001c]/40"
              onChange={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set("q", e.target.value);
                window.history.pushState({}, "", url);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  search((e.target as HTMLInputElement).value);
                }
              }}
            />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        {query && (
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex gap-2">
              {(["all", "vendors", "food"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    activeTab === tab
                      ? "bg-[#ba001c] text-white"
                      : "bg-white text-[#814c55] border border-[#dd9ca6]/30"
                  }`}
                >
                  {tab === "all" ? "All" : tab === "vendors" ? "Restaurants" : "Dishes"}
                </button>
              ))}
            </div>
            {activeTab !== "vendors" && (
              <div className="flex gap-2">
                <button onClick={() => setVegFilter("all")} className={`px-3 py-2 rounded-full text-xs font-bold ${vegFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
                  All
                </button>
                <button onClick={() => setVegFilter("veg")} className={`px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "veg" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}>
                  <span className="w-3 h-3 border-2 border-green-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span> Veg
                </button>
                <button onClick={() => setVegFilter("non_veg")} className={`px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "non_veg" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>
                  <span className="w-3 h-3 border-2 border-red-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span> Non-Veg
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <VendorCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : !query ? (
          <div className="py-8">
            {searchHistory.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-[#4d212a]">Recent Searches</h2>
                  <button onClick={clearHistory} className="text-xs text-[#ba001c] font-bold">Clear All</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((term) => (
                    <Link key={term} href={`/app/search?q=${term}`} className="px-4 py-2 bg-white rounded-full text-sm text-[#814c55] border border-[#dd9ca6]/30 hover:border-[#ba001c] transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">history</span>
                      {term}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="text-center py-8">
              <span className="text-6xl">🔍</span>
              <h2 className="text-xl font-bold text-[#4d212a] mt-4">Search for anything</h2>
              <p className="text-[#814c55] mt-2">Find restaurants, dishes, cuisines</p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {["Biryani", "Pizza", "Burgers", "Chinese", "South Indian", "Desserts"].map((tag) => (
                  <Link
                    key={tag}
                    href={`/app/search?q=${tag}`}
                    className="px-4 py-2 bg-white rounded-full text-sm text-[#814c55] border border-[#dd9ca6]/30 hover:border-[#ba001c] transition-all"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : totalResults === 0 ? (
          <div className="animate-fade-in">
            <EmptySearch query={query} />
            <div className="mt-8 text-center">
              <p className="text-sm text-[#814c55] mb-4">Popular searches</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Biryani", "Pizza", "Burgers", "Chinese", "South Indian", "Desserts", "North Indian", "Street Food"].map((tag) => (
                  <Link
                    key={tag}
                    href={`/app/search?q=${tag}`}
                    className="px-4 py-2 bg-white rounded-full text-sm text-[#814c55] border border-[#dd9ca6]/30 hover:border-[#ba001c] hover:bg-[#ba001c]/5 transition-all"
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
                <h3 className="text-lg font-bold text-[#4d212a] mb-4">
                  Restaurants ({filteredResults.vendors.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredResults.vendors.map((vendor) => (
                    <Link
                      key={vendor.id}
                      href={`/app/vendor/${vendor.id}`}
                      className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg transition-all"
                    >
                      <div className="h-32 bg-[#ffe1e4] relative">
                        {vendor.image_url ? (
                          <img src={vendor.image_url} alt={vendor.shop_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-[#dd9ca6]">restaurant</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-[#4d212a]">
                          ⭐ {vendor.rating?.toFixed(1) || "N/A"}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-[#4d212a]">{vendor.shop_name}</h4>
                        <p className="text-sm text-[#814c55]">{vendor.cuisine}</p>
                        <p className="text-xs text-[#814c55] mt-1">
                          {vendor.delivery_time_min}-{vendor.delivery_time_max} min • ₹{vendor.min_order_amount} min
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {filteredResults.menuItems.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-[#4d212a] mb-4">
                  Dishes ({filteredResults.menuItems.length})
                </h3>
                <div className="space-y-3">
                  {filteredResults.menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100"
                    >
                      <div className="w-20 h-20 bg-[#ffe1e4] rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-[#dd9ca6]">fastfood</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-3.5 h-3.5 border-2 ${item.is_veg ? "border-green-600" : "border-red-600"} rounded-sm flex items-center justify-center`}>
                            <span className={`w-1.5 h-1.5 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`}></span>
                          </span>
                          <h4 className="font-bold text-[#4d212a] truncate">{item.name}</h4>
                        </div>
                        <p className="text-sm text-[#814c55]">{item.vendor?.shop_name}</p>
                        <p className="text-sm font-bold text-[#ba001c] mt-1">₹{item.price}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(item);
                        }}
                        className="bg-[#ba001c] text-white p-2 rounded-lg hover:bg-[#a00018] transition-all"
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
    <Suspense fallback={
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}