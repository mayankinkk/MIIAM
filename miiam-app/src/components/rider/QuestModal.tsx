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
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="quest-modal-title" className="bg-[var(--color-surface-container-lowest)] rounded-2xl w-full max-w-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 id="quest-modal-title" className="font-bold text-lg">{t.rider.modals.dailyQuests}</h3>
          <button onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-4 rounded-xl mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="font-bold">{streakDays} {t.rider.modals.dayStreak}</span>
          </div>
          <p className="text-xs opacity-80">{t.rider.modals.streakDesc}</p>
        </div>
        
        <div className="space-y-3">
          {quests.map((quest) => (
            <div key={quest.id} className="p-3 bg-[var(--color-surface-subtle)] rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm">{quest.title}</span>
                <span className="text-status-success font-bold text-sm">+₹{quest.bonus}</span>
              </div>
              <div className="w-full h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-status-success rounded-full" 
                  style={{ width: `${(quest.current / quest.target) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-[var(--color-outline-variant)] mt-1">{quest.current}/{quest.target} {t.rider.modals.completed}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
