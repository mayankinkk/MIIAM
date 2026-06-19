"use client";

import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const MAX_VISIBLE = 5;

export const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],
  addToast: (message, type = "info", duration = 4000) => {
    const activeToasts = get().toasts || [];
    if (activeToasts.some((t) => t.message === message)) return;

    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type, duration };

    set((state) => {
      const updated = [toast, ...state.toasts];
      if (updated.length > MAX_VISIBLE) {
        return { toasts: updated.slice(0, MAX_VISIBLE) };
      }
      return { toasts: updated };
    });

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));
