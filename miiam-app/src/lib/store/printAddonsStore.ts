"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AddOnId } from "../printing-addons";
import type { RushTier } from "../printing-addons";

interface PrintAddonsStore {
  selected: AddOnId[];
  rushTier: RushTier;
  setSelected: (selected: AddOnId[]) => void;
  toggle: (id: AddOnId) => void;
  setRushTier: (tier: RushTier) => void;
  clear: () => void;
  has: (id: AddOnId) => boolean;
}

export const usePrintAddonsStore = create<PrintAddonsStore>()(
  persist(
    (set, get) => ({
      selected: [],
      rushTier: "standard",

      setSelected: (selected) => set({ selected }),
      toggle: (id) => {
        const cur = get().selected;
        if (cur.includes(id)) {
          set({ selected: cur.filter((x) => x !== id) });
        } else {
          set({ selected: [...cur, id] });
        }
      },
      setRushTier: (tier) => set({ rushTier: tier }),
      clear: () => set({ selected: [], rushTier: "standard" }),
      has: (id) => get().selected.includes(id),
    }),
    { name: "miiam-print-addons" }
  )
);
