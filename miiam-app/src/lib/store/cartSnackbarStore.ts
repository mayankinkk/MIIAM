"use client";

import { create } from "zustand";

interface CartSnackbarState {
  visible: boolean;
  itemName: string;
  showSnackbar: (itemName: string) => void;
  hideSnackbar: () => void;
}

export const useCartSnackbarStore = create<CartSnackbarState>()((set) => ({
  visible: false,
  itemName: "",
  showSnackbar: (itemName) => {
    set({ visible: true, itemName });
  },
  hideSnackbar: () => {
    set({ visible: false, itemName: "" });
  },
}));
