"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useToastStore } from "./toastStore";

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
  removeItem: (menu_item_id: string) => void;
  updateQuantity: (menu_item_id: string, quantity: number) => void;
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
        const existing = currentItems.find(
          (i) => i.menu_item_id === item.menu_item_id
        );
        if (existing) {
          set({
            items: currentItems.map((i) =>
              i.menu_item_id === item.menu_item_id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...currentItems, { ...item, quantity }] });
        }

        if (!suppressToast) {
          useToastStore.getState().addToast(`Added ${item.name} to cart`, "success");
        }
      },

      removeItem: (menu_item_id) => {
        const currentItems = get().items;
        if (!Array.isArray(currentItems)) return;
        const item = currentItems.find(i => i.menu_item_id === menu_item_id);
        set({ items: currentItems.filter((i) => i.menu_item_id !== menu_item_id) });
        if (item) {
          useToastStore.getState().addToast(`Removed ${item.name}`, "info");
        }
      },

      updateQuantity: (menu_item_id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menu_item_id);
          return;
        }
        const currentItems = get().items;
        if (!Array.isArray(currentItems)) return;
        const clamped = Math.min(quantity, 99);
        set({
          items: currentItems.map((i) =>
            i.menu_item_id === menu_item_id ? { ...i, quantity: clamped } : i
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
          return { ...current, items: p.items };
        }
        return current;
      },
    }
  )
);
