"use client";

import { create } from "zustand";

interface RiderOnlineState {
  isOnline: boolean;
  setOnline: (status: boolean) => void;
  toggleOnline: () => void;
}

export const useRiderOnlineStore = create<RiderOnlineState>((set) => ({
  isOnline: false,
  setOnline: (status) => set({ isOnline: status }),
  toggleOnline: () => set((state) => ({ isOnline: !state.isOnline })),
}));
