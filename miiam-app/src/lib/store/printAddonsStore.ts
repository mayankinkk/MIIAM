"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AddOnId } from "../printing-addons";
import type { RushTier } from "../printing-addons";

// Binding addons are mutually exclusive — only one can be selected
const BINDING_ADDONS: AddOnId[] = ["binding_spiral", "binding_soft", "binding_hard"];

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
          // If toggling a binding addon, remove other binding addons first
          if (BINDING_ADDONS.includes(id)) {
            const withoutOtherBindings = cur.filter((x) => !BINDING_ADDONS.includes(x) || x === id);
            set({ selected: [...withoutOtherBindings, id] });
          } else {
            set({ selected: [...cur, id] });
          }
        }
      },
      setRushTier: (tier) => set({ rushTier: tier }),
      clear: () => set({ selected: [], rushTier: "standard" }),
      has: (id) => get().selected.includes(id),
    }),
    { name: "miiam-print-addons" }
  )
);
