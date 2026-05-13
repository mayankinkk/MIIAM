"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SearchSuggestion {
  id: string;
  text: string;
  type: "recent" | "popular" | "cuisine" | "dish";
  icon?: string;
}

interface SearchAutocompleteProps {
  onSelect?: (query: string) => void;
  className?: string;
}

const popularSearches = [
  "Biryani", "Pizza", "Burger", "Paneer", "Chinese", "South Indian",
  "Ice Cream", "Cake", "Dosa", "Momos"
];

const cuisineIcons: Record<string, string> = {
  "Biryani": "🍚",
  "Pizza": "🍕",
  "Burger": "🍔",
  "Paneer": "🧀",
  "Chinese": "🥡",
  "South Indian": "🥘",
  "Ice Cream": "🍦",
  "Cake": "🎂",
  "Dosa": "🥞",
  "Momos": "🥟",
};

export function SearchAutocomplete({ onSelect, className = "" }: SearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const stored = localStorage.getItem("miiam-recent-searches");
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("miiam-recent-searches", JSON.stringify(updated));
  };

  const fetchSuggestions = async (search: string) => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("name")
      .ilike("name", `%${search}%`)
      .limit(5);

    const { data: vendors } = await supabase
      .from("vendors")
      .select("name")
      .ilike("name", `%${search}%`)
      .limit(3);

    const menuSuggestions: SearchSuggestion[] = (menuItems || []).map(item => ({
      id: `menu-${item.name}`,
      text: item.name,
      type: "dish" as const,
    }));

    const vendorSuggestions: SearchSuggestion[] = (vendors || []).map(v => ({
      id: `vendor-${v.name}`,
      text: v.name,
      type: "popular" as const,
    }));

    const matchedPopular: SearchSuggestion[] = popularSearches
      .filter(p => p.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 3)
      .map(p => ({
        id: `popular-${p}`,
        text: p,
        type: "popular" as const,
        icon: cuisineIcons[p],
      }));

    setSuggestions([...menuSuggestions, ...vendorSuggestions, ...matchedPopular]);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        fetchSuggestions(query);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    saveRecentSearch(term);
    setShowDropdown(false);
    setQuery("");
    onSelect?.(term);
    router.push(`/app/search?q=${encodeURIComponent(term)}`);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("miiam-recent-searches");
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">
          search
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowDropdown(true)}
          placeholder="Search for dishes, cuisines, restaurants..."
          className="w-full pl-12 pr-4 py-3 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c] focus:bg-white transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center hover:bg-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
          {loading && (
            <div className="p-4 text-center text-sm text-slate-500">
              <span className="material-symbols-outlined animate-spin text-lg mr-2">progress_activity</span>
              Searching...
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-bold text-slate-400 uppercase px-3 py-2">Suggestions</div>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSearch(s.text)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-slate-400 text-lg">
                    {s.type === "dish" ? "restaurant" : s.type === "popular" ? "local_fire_department" : "search"}
                  </span>
                  <span className="text-slate-700">{s.text}</span>
                  {s.icon && <span className="ml-auto text-lg">{s.icon}</span>}
                </button>
              ))}
              <button
                onClick={() => handleSearch(query)}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#ba001c]/5 hover:bg-[#ba001c]/10 rounded-lg text-[#ba001c] font-bold mt-2"
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                Search for "{query}"
              </button>
            </div>
          )}

          {!loading && !query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-xs font-bold text-slate-400 uppercase">Recent Searches</div>
                <button onClick={clearRecentSearches} className="text-xs text-[#ba001c] font-medium">
                  Clear all
                </button>
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleSearch(term)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-slate-400">history</span>
                  <span className="text-slate-700">{term}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && !query && (
            <div className="p-2 border-t">
              <div className="text-xs font-bold text-slate-400 uppercase px-3 py-2">Popular Searches</div>
              <div className="flex flex-wrap gap-2 px-3 py-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-600 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}