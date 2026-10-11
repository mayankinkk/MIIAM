"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export type VegFilterValue = "all" | "veg" | "non_veg";

interface VegFilterPillProps {
  value: VegFilterValue;
  onChange: (value: VegFilterValue) => void;
  className?: string;
  size?: "sm" | "md";
}

export default function VegFilterPill({
  value,
  onChange,
  className = "",
  size = "md",
}: VegFilterPillProps) {
  const { t } = useTranslation();
  const pillSize = size === "sm" ? "h-9 px-3 text-xs" : "h-10 px-4 text-xs";

  const base = `rounded-full font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${pillSize} ${className}`;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange("all")}
        className={`${base} ${value === "all" ? "bg-inverse-surface text-white" : "bg-surface-container text-on-surface-variant"}`}
      >
        {t.food.all}
      </button>
      <button
        onClick={() => onChange("veg")}
        className={`${base} ${value === "veg" ? "bg-green-600 text-white" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}
      >
        <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border-2 border-current">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
        {t.food.veg}
      </button>
      <button
        onClick={() => onChange("non_veg")}
        className={`${base} ${value === "non_veg" ? "bg-red-600 text-white" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
      >
        <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border-2 border-current">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
        {t.food.nonVeg}
      </button>
    </div>
  );
}
