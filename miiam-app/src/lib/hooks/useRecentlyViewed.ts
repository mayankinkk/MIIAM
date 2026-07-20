"use client";

import { useState, useEffect, useCallback } from "react";

interface RecentlyViewedItem {
  id: string;
  name: string;
  image_url?: string;
  cuisine?: string;
  rating?: string | number;
  viewed_at: number;
}

const STORAGE_KEY = "miiam-recently-viewed";
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch { /* ignore */ }
  }, []);

  const trackView = useCallback((vendor: Omit<RecentlyViewedItem, "viewed_at">) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(v => v.id !== vendor.id);
      const updated = [{ ...vendor, viewed_at: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  return { recentlyViewed, trackView, clearRecentlyViewed };
}
