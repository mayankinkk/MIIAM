"use client";

import { useState, useEffect } from "react";
import {
  ADDON_CATALOG,
  calculateAddOnCost,
  getAddOnPricing,
  rushEtaMinutes,
  rushMultiplier,
  type AddOnId,
  type AddOnPricing,
  type RushTier,
} from "@/lib/printing-addons";
import { usePrintAddonsStore } from "@/lib/store/printAddonsStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface PrintAddOnsProps {
  totalPages: number;
  copies: number;
  onTotalChange?: (total: number) => void;
}

export default function PrintAddOns({ totalPages, copies, onTotalChange }: PrintAddOnsProps) {
  const { t } = useTranslation();
  const { selected, toggle, rushTier, setRushTier } = usePrintAddonsStore();
  const [showAll, setShowAll] = useState(false);

  const pricing: AddOnPricing =
    typeof window === "undefined"
      ? {
          coverPage: 10, collatePerPage: 0.5, holePunch2: 8, holePunch3: 10, holePunch4: 12,
          foldBi: 5, foldTri: 8, bindingSpiral: 35, bindingSoft: 80, bindingHard: 150,
          laminationA4: 25, laminationId: 15, rush30Multiplier: 1.4, rush15Multiplier: 1.85,
        }
      : getAddOnPricing();

  const ctx = { totalPages, copies };
  const addOnTotal = selected.reduce(
    (acc, id) => acc + calculateAddOnCost(id, pricing, ctx),
    0
  );
  const rushMult = rushMultiplier(rushTier, pricing);

  useEffectLikeTotal(onTotalChange, addOnTotal);

  const visible = showAll ? ADDON_CATALOG : ADDON_CATALOG.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Rush tier selector */}
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary">bolt</span>
          <h3 className="font-bold text-on-surface">{t.print.rushTitle}</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["standard", "rush_30", "rush_15"] as RushTier[]).map((tier) => {
            const isActive = rushTier === tier;
            const mult = rushMultiplier(tier, pricing);
            const label =
              tier === "standard" ? t.print.rushStandard :
              tier === "rush_30" ? t.print.rush30 :
              t.print.rush15;
            return (
              <button
                key={tier}
                onClick={() => setRushTier(tier)}
                className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant text-on-surface"
                }`}
              >
                <div className="text-base font-black">{label}</div>
                <div className="text-[10px] opacity-70 mt-1">
                  {tier === "standard" ? "Free" : `+${Math.round((mult - 1) * 100)}%`}
                </div>
                <div className="text-[10px] opacity-70 mt-0.5">ETA ~{rushEtaMinutes(tier)} min</div>
              </button>
            );
          })}
        </div>
        {rushTier !== "standard" && (
          <p className="text-[11px] text-primary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">recommend</span>
            {t.print.rushRecommended}
          </p>
        )}
      </div>

      {/* Add-ons */}
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              {t.print.addonsTitle}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">{t.print.addonsSubtitle}</p>
          </div>
          {selected.length > 0 && (
            <span className="text-[11px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
              {t.print.addonsSelected
                .replace("{n}", String(selected.length))
                .replace("{nPlural}", selected.length > 1 ? "s" : "")}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {visible.map((desc) => {
            const isSelected = selected.includes(desc.id);
            const cost = calculateAddOnCost(desc.id, pricing, ctx);
            return (
              <button
                key={desc.id}
                onClick={() => toggle(desc.id as AddOnId)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant/30 bg-surface-container-high hover:border-primary/50"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? "bg-primary text-white" : "bg-indigo-100 text-indigo-700"
                }`}>
                  <span className="material-symbols-outlined text-lg">{desc.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface leading-tight">{desc.label}</p>
                  <p className="text-[11px] text-on-surface-variant leading-snug">{desc.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-on-surface">₹{cost.toFixed(0)}</p>
                  <p className="text-[10px] text-on-surface-variant/60">{desc.unitLabel}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  isSelected ? "border-primary bg-primary" : "border-outline-variant"
                }`}>
                  {isSelected && (
                    <span className="material-symbols-outlined text-white text-sm">check</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {ADDON_CATALOG.length > 6 && (
          <button
            onClick={() => setShowAll((s) => !s)}
            className="w-full py-2 mt-2 text-xs font-bold text-primary"
          >
            {showAll ? "Show less" : `Show all ${ADDON_CATALOG.length} add-ons`}
          </button>
        )}

        {addOnTotal > 0 && (
          <div className="mt-3 pt-3 border-t border-outline-variant/10 flex items-center justify-between">
            <span className="text-sm font-bold text-on-surface">Add-ons total</span>
            <span className="text-base font-black text-primary">₹{addOnTotal.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function useEffectLikeTotal(onTotalChange: ((n: number) => void) | undefined, total: number) {
  useEffect(() => {
    onTotalChange?.(total);
  }, [total, onTotalChange]);
}
