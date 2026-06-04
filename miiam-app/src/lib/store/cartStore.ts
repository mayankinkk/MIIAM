"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useToastStore } from "./toastStore";
import { PRINT_MENU_ITEM_ID } from "@/lib/constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CartItem {
  id: string;
  menu_item_id: string;
  vendor_id: string;
  vendor_name: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  special_notes?: string;
  is_veg?: boolean;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number, suppressToast?: boolean) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  subtotalByVendor: (vendor_id: string) => number;
}

function isCartItemArray(value: unknown): value is CartItem[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (i) =>
      i &&
      typeof i === "object" &&
      typeof i.menu_item_id === "string" &&
      typeof i.vendor_id === "string" &&
      typeof i.name === "string" &&
      typeof i.price === "number" &&
      typeof i.quantity === "number"
  );
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1, suppressToast = false) => {
        const currentItems = get().items;
        if (!Array.isArray(currentItems)) {
          set({ items: [{ ...item, quantity }] });
          return;
        }
        const existing = currentItems.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          });
        } else {
          set({ items: [...currentItems, { ...item, quantity }] });
        }

        if (!suppressToast) {
          useToastStore.getState().addToast(`Added ${item.name} to cart`, "success");
        }
      },

      removeItem: (id) => {
        const currentItems = get().items;
        if (!Array.isArray(currentItems)) return;
        const item = currentItems.find((i) => i.id === id);
        set({ items: currentItems.filter((i) => i.id !== id) });
        if (item) {
          useToastStore.getState().addToast(`Removed ${item.name}`, "info");
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        const currentItems = get().items;
        if (!Array.isArray(currentItems)) return;
        const clamped = Math.min(quantity, 99);
        set({
          items: currentItems.map((i) =>
            i.id === id ? { ...i, quantity: clamped } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => {
        const items = get().items;
        return Array.isArray(items) ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;
      },

      totalPrice: () => {
        const items = get().items;
        return Array.isArray(items)
          ? items.reduce((sum, i) => sum + i.price * i.quantity, 0)
          : 0;
      },

      subtotalByVendor: (vendor_id) => {
        const items = get().items;
        if (!Array.isArray(items)) return 0;
        return items
          .filter((i) => i.vendor_id === vendor_id)
          .reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
    }),
    {
      name: "miiam-cart",
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => {
        const p = persisted as { items?: unknown };
        if (p && isCartItemArray(p.items)) {
          const items = p.items.map((item) => {
            if (item.vendor_id === "f1111111-1111-4000-8000-000000000000" && !UUID_RE.test(item.menu_item_id)) {
              return { ...item, menu_item_id: PRINT_MENU_ITEM_ID };
            }
            return item;
          });
          return { ...current, items };
        }
        return current;
      },
    }
  )
);
