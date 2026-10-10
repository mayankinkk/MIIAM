"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface Quest {
  id: number;
  title: string;
  current: number;
  target: number;
  bonus: number;
}

interface QuestModalProps {
  open: boolean;
  quests: Quest[];
  streakDays: number;
  onClose: () => void;
}

export default function QuestModal({ open, quests, streakDays, onClose }: QuestModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-modal-title"
        className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="quest-modal-title" className="text-lg font-bold">
            {t.rider.modals.dailyQuests}
          </h3>
          <button onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 p-4 text-white">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <span className="font-bold">
              {streakDays} {t.rider.modals.dayStreak}
            </span>
          </div>
          <p className="text-xs opacity-80">{t.rider.modals.streakDesc}</p>
        </div>

        <div className="space-y-3">
          {quests.map((quest) => (
            <div key={quest.id} className="rounded-xl bg-[var(--color-surface-subtle)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold">{quest.title}</span>
                <span className="text-status-success text-sm font-bold">+₹{quest.bonus}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                <div
                  className="bg-status-success h-full rounded-full"
                  style={{ width: `${(quest.current / quest.target) * 100}%` }}
                ></div>
              </div>
              <p className="mt-1 text-[10px] text-[var(--color-outline-variant)]">
                {quest.current}/{quest.target} {t.rider.modals.completed}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
