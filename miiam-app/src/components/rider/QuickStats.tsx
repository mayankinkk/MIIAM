"use client";

import WeatherWidget from "./WeatherWidget";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface QuickStatsProps {
  todayEarnings: number;
  liveEarnings: number;
  cashCollected: number;
  cashPending: number;
  dndMode: boolean;
  hasActiveOrder: boolean;
  deliveryStep: string;
}

export default function QuickStats({
  todayEarnings,
  liveEarnings,
  cashCollected,
  cashPending,
  dndMode,
  hasActiveOrder,
  deliveryStep,
}: QuickStatsProps) {
  const { t } = useTranslation();
  return (
    <div className="fixed top-20 left-4 z-20 space-y-2">
      <WeatherWidget />
      <div className="rounded-xl bg-[var(--color-surface-container-lowest)]/90 p-3 shadow-lg backdrop-blur">
        <p className="text-[10px] text-[var(--color-outline-variant)]">
          {t.rider.stats.todayEarnings}
        </p>
        <p className="text-status-success text-xl font-black">₹{todayEarnings + liveEarnings}</p>
        {hasActiveOrder && (deliveryStep === "delivering" || deliveryStep === "picking_up") && (
          <p className="animate-pulse text-[8px] text-orange-500">
            +₹{liveEarnings} ({t.rider.stats.live})
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-container-lowest)]/90 p-2 shadow-lg backdrop-blur">
        <span
          className="material-symbols-outlined text-status-success text-sm"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          account_balance_wallet
        </span>
        <div>
          <p className="text-[8px] text-[var(--color-outline-variant)]">{t.rider.stats.cash}</p>
          <p className="text-xs font-bold">
            ₹{cashCollected}{" "}
            <span className="text-[var(--color-outline-variant)]">/ ₹{cashPending}</span>
          </p>
        </div>
      </div>
      {dndMode && (
        <div className="bg-status-error/90 flex items-center gap-2 rounded-xl px-3 py-2 text-white shadow-lg backdrop-blur">
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            do_not_disturb
          </span>
          <span className="text-xs font-bold">{t.rider.stats.dndActive}</span>
        </div>
      )}
    </div>
  );
}
