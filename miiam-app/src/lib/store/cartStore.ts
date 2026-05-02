"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (menu_item_id: string) => void;
  updateQuantity: (menu_item_id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  subtotalByVendor: (vendor_id: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        const existing = get().items.find(
          (i) => i.menu_item_id === item.menu_item_id
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.menu_item_id === item.menu_item_id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity }] });
        }
      },

      removeItem: (menu_item_id) => {
        set({ items: get().items.filter((i) => i.menu_item_id !== menu_item_id) });
      },

      updateQuantity: (menu_item_id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menu_item_id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.menu_item_id === menu_item_id ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      subtotalByVendor: (vendor_id) =>
        get()
          .items.filter((i) => i.vendor_id === vendor_id)
          .reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "miiam-cart" }
  )
);
