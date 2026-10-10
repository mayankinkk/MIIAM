"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QuickCommerceStore {
  isQuickMode: boolean;
  setQuickMode: (enabled: boolean) => void;
}

export const useQuickCommerceStore = create<QuickCommerceStore>()(
  persist(
    (set) => ({
      isQuickMode: false,
      setQuickMode: (enabled) => set({ isQuickMode: enabled }),
    }),
    { name: "miiam-quick-commerce" }
  )
);

interface QuickCommerceToggleProps {
  onToggle?: (enabled: boolean) => void;
}

export function QuickCommerceToggle({ onToggle }: QuickCommerceToggleProps) {
  const { isQuickMode, setQuickMode } = useQuickCommerceStore();

  const handleToggle = () => {
    const newValue = !isQuickMode;
    setQuickMode(newValue);
    onToggle?.(newValue);
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
        isQuickMode
          ? "text-on-primary bg-[var(--color-primary)] shadow-[var(--color-primary)]/20 shadow-lg"
          : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]"
      }`}
    >
      <span className={`material-symbols-outlined text-lg ${isQuickMode ? "animate-pulse" : ""}`}>
        flash_on
      </span>
      <span>10-min Delivery</span>
      {isQuickMode && <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">ON</span>}
    </button>
  );
}

export function QuickCommerceBadge() {
  const { isQuickMode } = useQuickCommerceStore();

  if (!isQuickMode) return null;

  return (
    <div
      className="text-on-primary fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-bold shadow-lg"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <span className="material-symbols-outlined animate-pulse text-lg">flash_on</span>
      <span>10-min delivery</span>
      <button
        onClick={() => useQuickCommerceStore.getState().setQuickMode(false)}
        className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
