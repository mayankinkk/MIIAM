"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export type CopiesPreset = 1 | 5 | 10 | 25 | 50 | 100;

const PRESETS: { value: CopiesPreset; label: string; desc: string; icon: string }[] = [
  { value: 1, label: "1 copy", desc: "Single", icon: "looks_one" },
  { value: 5, label: "5 copies", desc: "Class set", icon: "looks_5" },
  { value: 10, label: "10 copies", desc: "Team", icon: "filter_10" },
  { value: 25, label: "25 copies", desc: "Bulk", icon: "inventory_2" },
  { value: 50, label: "50 copies", desc: "Bulk+", icon: "inventory" },
  { value: 100, label: "100 copies", desc: "Wholesale", icon: "warehouse" },
];

interface Props {
  copies: number;
  onChange: (n: number) => void;
}

export default function BulkOrderShortcuts({ copies, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t.print.bulkTitle || "Quick copies"}</p>
        <span className="text-[10px] text-on-surface-variant">Up to 50 files × 100 copies</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {PRESETS.map((p) => {
          const active = copies === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border transition-all ${
                active
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                  : "bg-[var(--color-surface-container-lowest)] text-on-surface border-outline-variant/30 hover:border-indigo-300 hover:bg-indigo-50"
              }`}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
              <span className="text-[10px] font-black">{p.label}</span>
              <span className={`text-[9px] ${active ? "text-white/80" : "text-on-surface-variant"}`}>{p.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
