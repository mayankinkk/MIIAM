"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export type VegFilterValue = "all" | "veg" | "non_veg";

interface CompactVegToggleProps {
  value: VegFilterValue;
  onChange: (value: VegFilterValue) => void;
}

const cycle: Record<VegFilterValue, VegFilterValue> = {
  all: "veg",
  veg: "non_veg",
  non_veg: "all",
};

const labels: Record<VegFilterValue, string> = {
  all: "All",
  veg: "Veg",
  non_veg: "Non-Veg",
};

export default function CompactVegToggle({ value, onChange }: CompactVegToggleProps) {
  const { t } = useTranslation();

  const handleCycle = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    onChange(cycle[value]);
  };

  return (
    <button
      onClick={handleCycle}
      aria-label={`Filter: ${labels[value]}. Tap to cycle.`}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
        value === "veg"
          ? "bg-green-600 text-white"
          : value === "non_veg"
            ? "bg-red-600 text-white"
            : "bg-surface-container text-on-surface-variant"
      }`}
    >
      {value !== "all" ? (
        <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border-2 border-current">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : (
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          filter_list
        </span>
      )}
      {value === "all" ? t.food.all : value === "veg" ? t.food.veg : t.food.nonVeg}
    </button>
  );
}
