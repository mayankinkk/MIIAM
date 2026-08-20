"use client";

import { create } from "zustand";

interface CartSnackbarState {
  visible: boolean;
  itemName: string;
  itemImage: string;
  itemPrice: number;
  showSnackbar: (itemName: string, itemImage?: string, itemPrice?: number) => void;
  hideSnackbar: () => void;
}

export const useCartSnackbarStore = create<CartSnackbarState>()((set) => ({
  visible: false,
  itemName: "",
  itemImage: "",
  itemPrice: 0,
  showSnackbar: (itemName, itemImage = "", itemPrice = 0) => {
    set({ visible: true, itemName, itemImage, itemPrice });
  },
  hideSnackbar: () => {
    set({ visible: false, itemName: "", itemImage: "", itemPrice: 0 });
  },
}));
