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

export default function DashboardHeader({
  isOnline,
  streakDays,
  onToggleOnline,
  onOpenQuests,
}: DashboardHeaderProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  return (
    <header className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-white/20 bg-[var(--color-surface-container-lowest)]/90 px-4 py-3 shadow-lg backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <span className="text-primary text-xl font-black tracking-tighter italic">MIIAM</span>
        <button
          onClick={onToggleOnline}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
            isOnline
              ? "bg-green-100 text-green-700"
              : "bg-[var(--color-surface-container-high)] text-[var(--color-outline)]"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-slate-400"}`} />
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
          className="bg-status-error/10 animate-pulse rounded-full p-2"
          title={t.rider.header.emergencySos}
        >
          <span className="material-symbols-outlined text-status-error">emergency</span>
        </button>
        <button
          onClick={onOpenQuests}
          className="bg-status-warning/10 relative rounded-full p-2"
          title={t.rider.header.dailyQuests}
        >
          <span className="material-symbols-outlined text-status-warning">
            local_fire_department
          </span>
          {streakDays > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white">
              {streakDays}
            </span>
          )}
        </button>
        <Link
          href="/rider/analytics"
          className="bg-status-info/10 dark:bg-status-info/20 rounded-full p-2"
          title={t.rider.header.analytics}
        >
          <span className="material-symbols-outlined text-status-info">insights</span>
        </Link>
        <Link href="/rider/account" className="p-2">
          <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
            person
          </span>
        </Link>
      </div>
    </header>
  );
}
