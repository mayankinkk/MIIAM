"use client";

import WeatherWidget from "./WeatherWidget";

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
  return (
    <div className="fixed top-20 left-4 z-20 space-y-2">
      <WeatherWidget />
      <div className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg">
        <p className="text-[10px] text-slate-400">TODAY'S EARNINGS</p>
        <p className="font-black text-xl text-green-600">₹{todayEarnings + liveEarnings}</p>
        {hasActiveOrder && (deliveryStep === "delivering" || deliveryStep === "picking_up") && (
          <p className="text-[8px] text-orange-500 animate-pulse">+₹{liveEarnings} (Live)</p>
        )}
      </div>
      <div className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg flex items-center gap-2">
        <span className="material-symbols-outlined text-green-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
        <div>
          <p className="text-[8px] text-slate-400">CASH</p>
          <p className="text-xs font-bold">₹{cashCollected} <span className="text-slate-400">/ ₹{cashPending}</span></p>
        </div>
      </div>
      {dndMode && (
        <div className="bg-red-500/90 backdrop-blur px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 text-white">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>do_not_disturb</span>
          <span className="text-xs font-bold">DND Active</span>
        </div>
      )}
    </div>
  );
}
