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
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
        isQuickMode 
          ? "bg-[#ba001c] text-white shadow-lg shadow-[#ba001c]/20" 
          : "bg-white text-slate-700 border border-slate-200"
      }`}
    >
      <span className={`material-symbols-outlined text-lg ${isQuickMode ? "animate-pulse" : ""}`}>
        flash_on
      </span>
      <span>10-min Delivery</span>
      {isQuickMode && (
        <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
          ON
        </span>
      )}
    </button>
  );
}

export function QuickCommerceBadge() {
  const { isQuickMode } = useQuickCommerceStore();
  
  if (!isQuickMode) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#ba001c] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 z-40">
      <span className="material-symbols-outlined text-lg animate-pulse">flash_on</span>
      <span>10-min delivery</span>
      <button 
        onClick={() => useQuickCommerceStore.getState().setQuickMode(false)}
        className="ml-2 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}