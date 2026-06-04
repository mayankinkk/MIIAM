"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ServicePresetId =
  | "bw"
  | "color"
  | "passport"
  | "spiral"
  | "soft"
  | "hard"
  | "lamination_a4"
  | "lamination_id"
  | "photo"
  | "bulk"
  | "reports";

export interface PrintServiceConfig {
  id: ServicePresetId;
  enabled: boolean;
  price: string;
  eta: string;
  badge: string | null;
  order: number;
}

export const DEFAULT_SERVICES: PrintServiceConfig[] = [
  { id: "bw", enabled: true, price: "from ₹2/pg", eta: "30 min", badge: null, order: 0 },
  { id: "color", enabled: true, price: "from ₹10/pg", eta: "30 min", badge: "Popular", order: 1 },
  { id: "passport", enabled: true, price: "from ₹99", eta: "15 min", badge: null, order: 2 },
  { id: "spiral", enabled: true, price: "from ₹35", eta: "30 min", badge: null, order: 3 },
  { id: "soft", enabled: true, price: "from ₹80", eta: "45 min", badge: null, order: 4 },
  { id: "hard", enabled: true, price: "from ₹150", eta: "1 hr", badge: null, order: 5 },
  { id: "lamination_a4", enabled: true, price: "from ₹25", eta: "20 min", badge: null, order: 6 },
  { id: "lamination_id", enabled: true, price: "from ₹15", eta: "15 min", badge: null, order: 7 },
  { id: "photo", enabled: true, price: "from ₹25", eta: "30 min", badge: null, order: 8 },
  { id: "bulk", enabled: true, price: "from ₹2/pg", eta: "1-2 hr", badge: null, order: 9 },
  { id: "reports", enabled: true, price: "from ₹2/pg", eta: "45 min", badge: null, order: 10 },
];

interface PrintServiceStore {
  services: PrintServiceConfig[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setService: (id: ServicePresetId, patch: Partial<PrintServiceConfig>) => void;
  toggleEnabled: (id: ServicePresetId) => void;
  move: (id: ServicePresetId, direction: "up" | "down") => void;
  resetToDefaults: () => void;
}

const sortByOrder = (a: PrintServiceConfig, b: PrintServiceConfig) => a.order - b.order;

const reorderAfterMove = (
  services: PrintServiceConfig[],
  id: ServicePresetId,
  direction: "up" | "down"
): PrintServiceConfig[] => {
  const sorted = [...services].sort(sortByOrder);
  const idx = sorted.findIndex((s) => s.id === id);
  if (idx === -1) return services;
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= sorted.length) return services;
  const tmp = sorted[idx];
  sorted[idx] = sorted[targetIdx];
  sorted[targetIdx] = tmp;
  return sorted.map((s, i) => ({ ...s, order: i }));
};

export const usePrintServiceStore = create<PrintServiceStore>()(
  persist(
    (set, get) => ({
      services: DEFAULT_SERVICES,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      setService: (id, patch) => {
        const cur = get().services;
        set({
          services: cur.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        });
      },

      toggleEnabled: (id) => {
        const cur = get().services.find((s) => s.id === id);
        if (!cur) return;
        get().setService(id, { enabled: !cur.enabled });
      },

      move: (id, direction) => {
        set({ services: reorderAfterMove(get().services, id, direction) });
      },

      resetToDefaults: () => set({ services: DEFAULT_SERVICES }),
    }),
    {
      name: "miiam-print-services",
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    }
  )
);

export const selectSortedEnabledServices = (state: PrintServiceStore): PrintServiceConfig[] =>
  state.services.filter((s) => s.enabled).sort(sortByOrder);

export const selectAllServices = (state: PrintServiceStore): PrintServiceConfig[] =>
  [...state.services].sort(sortByOrder);

export { reorderAfterMove };
