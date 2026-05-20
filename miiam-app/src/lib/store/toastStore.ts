"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>()(
  persist(
    (set, get) => ({
      toasts: [],
      addToast: (message, type = "info") => {
        // Prevent duplicate toast messages from showing at the same time
        const activeToasts = get().toasts || [];
        if (activeToasts.some((t) => t.message === message)) return;

        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 4000);
      },
      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
      clearToasts: () => set({ toasts: [] }),
    }),
    { name: "miiam-toasts", partialize: () => ({}) }
  )
);