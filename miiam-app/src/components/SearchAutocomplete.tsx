"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  preventNavigation?: boolean;
  className?: string;
  placeholder?: string;
}

const popularSearches = [
  "Biryani",
  "Pizza",
  "Burger",
  "Paneer",
  "Chinese",
  "South Indian",
  "Ice Cream",
  "Cake",
  "Dosa",
  "Momos",
];

const cuisineIcons: Record<string, string> = {
  Biryani: "🍚",
  Pizza: "🍕",
  Burger: "🍔",
  Paneer: "🧀",
  Chinese: "🥡",
  "South Indian": "🥘",
  "Ice Cream": "🍦",
  Cake: "🎂",
  Dosa: "🥞",
  Momos: "🥟",
};

export function SearchAutocomplete({
  onSelect,
  preventNavigation = false,
  className = "",
  placeholder = "Search for dishes, cuisines, restaurants...",
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useRef(`search-listbox-${Math.random().toString(36).slice(2, 9)}`);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

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
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
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

    const menuSuggestions: SearchSuggestion[] = (menuItems || []).map((item: { name: string }) => ({
      id: `menu-${item.name}`,
      text: item.name,
      type: "dish" as const,
    }));

    const vendorSuggestions: SearchSuggestion[] = (vendors || []).map(
      (v: { shop_name: string }) => ({
        id: `vendor-${v.shop_name}`,
        text: v.shop_name,
        type: "popular" as const,
      })
    );

    const matchedPopular: SearchSuggestion[] = popularSearches
      .filter((p) => p.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 3)
      .map((p) => ({
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

  const allItems =
    showDropdown && !query && recentSearches.length > 0
      ? recentSearches.map((t) => ({ id: `recent-${t}`, text: t, type: "recent" as const }))
      : suggestions;

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    saveRecentSearch(term);
    setShowDropdown(false);
    setQuery("");
    setActiveIndex(-1);
    onSelect?.(term);
    if (!preventNavigation) {
      router.push(`/app/search?q=${encodeURIComponent(term)}`);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("miiam-recent-searches");
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return;

      const items = allItems;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < items.length) {
            handleSearch(items[activeIndex].text);
          } else if (query.trim()) {
            handleSearch(query);
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowDropdown(false);
          setActiveIndex(-1);
          break;
      }
    },
    [showDropdown, allItems, activeIndex, query]
  );

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative">
        <span
          className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-outline-variant)]"
          aria-hidden="true"
        >
          search
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => query.trim() && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search restaurants and dishes"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId.current}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId.current}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          className="w-full rounded-full bg-[var(--color-surface-container)] py-3 pr-4 pl-12 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
            }}
            aria-label="Clear search"
            className="absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-300 transition-colors hover:bg-slate-400"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              close
            </span>
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id={listboxId.current}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-xl"
        >
          {loading && (
            <div className="p-4 text-center text-sm text-[var(--color-outline)]" role="status">
              <span
                className="material-symbols-outlined mr-2 animate-spin text-lg"
                aria-hidden="true"
              >
                progress_activity
              </span>
              Searching...
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                Suggestions
              </div>
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  id={`${listboxId.current}-option-${i}`}
                  role="option"
                  aria-selected={activeIndex === i}
                  onClick={() => handleSearch(s.text)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${activeIndex === i ? "bg-[var(--color-primary)]/10" : "hover:bg-[var(--color-surface-subtle)]"}`}
                >
                  <span
                    className="material-symbols-outlined text-lg text-[var(--color-outline-variant)]"
                    aria-hidden="true"
                  >
                    {s.type === "dish"
                      ? "restaurant"
                      : s.type === "popular"
                        ? "local_fire_department"
                        : "search"}
                  </span>
                  <span className="text-[var(--color-on-surface)]">{s.text}</span>
                  {s.icon && (
                    <span className="ml-auto text-lg" aria-hidden="true">
                      {s.icon}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => handleSearch(query)}
                className="mt-2 flex w-full items-center gap-3 rounded-lg bg-[var(--color-primary)]/5 px-3 py-2.5 font-bold text-[var(--color-accent)] hover:bg-[var(--color-primary)]/10"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  arrow_forward
                </span>
                Search for &quot;{query}&quot;
              </button>
            </div>
          )}

          {!loading && !query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Recent Searches
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs font-medium text-[var(--color-accent)]"
                >
                  Clear all
                </button>
              </div>
              {recentSearches.map((term, i) => (
                <button
                  key={term}
                  id={`${listboxId.current}-option-${i}`}
                  role="option"
                  aria-selected={activeIndex === i}
                  onClick={() => handleSearch(term)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${activeIndex === i ? "bg-[var(--color-primary)]/10" : "hover:bg-[var(--color-surface-subtle)]"}`}
                >
                  <span
                    className="material-symbols-outlined text-[var(--color-outline-variant)]"
                    aria-hidden="true"
                  >
                    history
                  </span>
                  <span className="text-[var(--color-on-surface)]">{term}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && !query && (
            <div className="border-t p-2">
              <div className="px-3 py-2 text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-2 px-3 py-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="rounded-full bg-[var(--color-surface-container)] px-4 py-2.5 text-sm text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-high)]"
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
