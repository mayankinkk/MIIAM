"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useToastStore } from "./toastStore";

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
  savedItems: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number, suppressToast?: boolean) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateQuantityByMenuItem: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  saveForLater: (id: string) => void;
  moveToCart: (id: string) => void;
  removeSaved: (id: string) => void;
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
      savedItems: [],

      addItem: (item, quantity = 1, suppressToast = false) => {
        const currentItems = get().items;
        if (!Array.isArray(currentItems)) {
          set({ items: [{ ...item, quantity }] });
        } else {
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
        }

        // Haptic feedback on add
        import("@/lib/haptics").then(({ hapticFeedback }) => hapticFeedback("success"));

        if (!suppressToast) {
          useToastStore.getState().addToast(`Added ${item.name} to cart`, "success");
        }
      },

      removeItem: (id) => {
        const currentItems = get().items;
        if (!Array.isArray(currentItems)) return;
        const item = currentItems.find((i) => i.id === id);
        set({ items: currentItems.filter((i) => i.id !== id) });

        // Haptic feedback on remove
        try { navigator.vibrate?.(15); } catch {}
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

      updateQuantityByMenuItem: (menuItemId, quantity) => {
        if (quantity <= 0) {
          const item = get().items.find((i) => i.menu_item_id === menuItemId);
          if (item) get().removeItem(item.id);
          return;
        }
        const currentItems = get().items;
        if (!Array.isArray(currentItems)) return;
        const clamped = Math.min(quantity, 99);
        set({
          items: currentItems.map((i) =>
            i.menu_item_id === menuItemId ? { ...i, quantity: clamped } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      saveForLater: (id) => {
        const items = get().items;
        const saved = get().savedItems;
        const item = items.find((i) => i.id === id);
        if (!item) return;
        set({
          items: items.filter((i) => i.id !== id),
          savedItems: [...saved, item],
        });
        useToastStore.getState().addToast(`${item.name} saved for later`, "info");
      },

      moveToCart: (id) => {
        const items = get().items;
        const saved = get().savedItems;
        const item = saved.find((i) => i.id === id);
        if (!item) return;
        const existing = items.find((i) => i.id === id);
        if (existing) {
          set({
            items: items.map((i) => i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i),
            savedItems: saved.filter((i) => i.id !== id),
          });
        } else {
          set({
            items: [...items, item],
            savedItems: saved.filter((i) => i.id !== id),
          });
        }
        useToastStore.getState().addToast(`${item.name} moved to cart`, "success");
      },

      removeSaved: (id) => {
        const saved = get().savedItems;
        set({ savedItems: saved.filter((i) => i.id !== id) });
      },

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
      partialize: (state) => ({ items: state.items, savedItems: state.savedItems }),
      merge: (persisted, current) => {
        const p = persisted as { items?: unknown; savedItems?: unknown };
        const result = { ...current };
        if (p && isCartItemArray(p.items)) {
          result.items = p.items;
        }
        if (p && isCartItemArray(p.savedItems)) {
          result.savedItems = p.savedItems;
        }
        return result;
      },
    }
  )
);
