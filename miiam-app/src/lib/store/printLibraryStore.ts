"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PrintLibraryItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  addedAt: number;
  lastPrintedAt?: number;
  printCount: number;
}

interface PrintLibraryStore {
  files: PrintLibraryItem[];
  addFile: (item: Omit<PrintLibraryItem, "addedAt" | "printCount" | "id"> & { id?: string }) => void;
  removeFile: (id: string) => void;
  incrementPrintCount: (id: string) => void;
  clearAll: () => void;
  totalSize: () => number;
  MAX_BYTES: number;
  MAX_ITEMS: number;
}

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB library cap
const MAX_ITEMS = 50;

export const usePrintLibraryStore = create<PrintLibraryStore>()(
  persist(
    (set, get) => ({
      files: [],
      MAX_BYTES,
      MAX_ITEMS,

      addFile: (item) => {
        const id = item.id || `lib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const existing = get().files;
        const dedup = existing.filter((f) => f.url !== item.url);

        // Enforce MAX_BYTES: drop oldest files if adding this file would exceed limit
        let withNew = [
          { ...item, id, addedAt: Date.now(), printCount: 0 },
          ...dedup,
        ];
        let totalSize = withNew.reduce((acc, f) => acc + f.size, 0);
        while (totalSize > MAX_BYTES && withNew.length > 1) {
          const removed = withNew.pop();
          if (removed) totalSize -= removed.size;
        }

        // Also enforce MAX_ITEMS
        withNew = withNew.slice(0, MAX_ITEMS);
        set({ files: withNew });
      },

      removeFile: (id) => set({ files: get().files.filter((f) => f.id !== id) }),

      incrementPrintCount: (id) => {
        set({
          files: get().files.map((f) =>
            f.id === id
              ? { ...f, printCount: f.printCount + 1, lastPrintedAt: Date.now() }
              : f
          ),
        });
      },

      clearAll: () => set({ files: [] }),

      totalSize: () => get().files.reduce((acc, f) => acc + f.size, 0),
    }),
    {
      name: "miiam-print-library",
    }
  )
);
