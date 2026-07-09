"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface DashboardHeaderProps {
  isOnline: boolean;
  streakDays: number;
  onToggleOnline: () => void;
  onOpenQuests: () => void;
}

export default function DashboardHeader({ isOnline, streakDays, onToggleOnline, onOpenQuests }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-[var(--color-surface-container-lowest)]/90 backdrop-blur-lg border-b border-white/20 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-xl font-black italic tracking-tighter text-primary">MIIAM</span>
        <button
          onClick={onToggleOnline}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
            isOnline ? "bg-green-100 text-green-700" : "bg-[var(--color-surface-container-high)] text-[var(--color-outline)]"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-slate-400"}`} />
          {isOnline ? t.rider.header.online : t.rider.header.offline}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={async () => {
            const ok = await confirm({
              title: "Emergency SOS",
              message: "Are you sure you want to send an SOS alert?",
              confirmText: "Send SOS",
              variant: "danger",
            });
            if (ok) {
              window.open("tel:+919957873472", "_self");
            }
          }}
          className="p-2 bg-red-50 rounded-full animate-pulse" 
          title={t.rider.header.emergencySos}
        >
          <span className="material-symbols-outlined text-red-500">emergency</span>
        </button>
        <button 
          onClick={onOpenQuests}
          className="p-2 bg-amber-50 rounded-full relative" 
          title={t.rider.header.dailyQuests}
        >
          <span className="material-symbols-outlined text-amber-500">local_fire_department</span>
          {streakDays > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {streakDays}
            </span>
          )}
        </button>
        <Link href="/rider/analytics" className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full" title={t.rider.header.analytics}>
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">insights</span>
        </Link>
        <Link href="/rider/account" className="p-2">
          <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">person</span>
        </Link>
      </div>
    </header>
  );
}
