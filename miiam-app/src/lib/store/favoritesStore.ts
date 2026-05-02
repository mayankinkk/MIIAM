"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesStore {
  favoriteIds: string[];
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggle: (id) => {
        const ids = get().favoriteIds;
        set({
          favoriteIds: ids.includes(id)
            ? ids.filter((i) => i !== id)
            : [...ids, id],
        });
      },
      isFavorite: (id) => get().favoriteIds.includes(id),
    }),
    { name: "miiam-favorites" }
  )
);
