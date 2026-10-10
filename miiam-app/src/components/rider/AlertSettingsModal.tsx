"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface AlertSettingsModalProps {
  open: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onSoundChange: (v: boolean) => void;
  onVibrationChange: (v: boolean) => void;
  onClearOrders: () => void;
  onClose: () => void;
}

export default function AlertSettingsModal({
  open,
  soundEnabled,
  vibrationEnabled,
  onSoundChange,
  onVibrationChange,
  onClearOrders,
  onClose,
}: AlertSettingsModalProps) {
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
        aria-labelledby="alert-settings-title"
        className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="alert-settings-title" className="text-xl font-bold">
            {t.rider.modals.alertSettings}
          </h3>
          <button onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-brand-secondary">volume_up</span>
              <div>
                <p className="font-bold">{t.rider.modals.soundAlert}</p>
                <p className="text-xs text-[var(--color-outline)]">
                  {t.rider.modals.soundAlertDesc}
                </p>
              </div>
            </div>
            <button
              onClick={() => onSoundChange(!soundEnabled)}
              className={`h-6 w-12 rounded-full transition-all ${soundEnabled ? "bg-green-500" : "bg-slate-300 dark:bg-gray-600"}`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] transition-all ${soundEnabled ? "translate-x-6" : "translate-x-0.5"}`}
              ></div>
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-brand-secondary">vibration</span>
              <div>
                <p className="font-bold">{t.rider.modals.vibration}</p>
                <p className="text-xs text-[var(--color-outline)]">
                  {t.rider.modals.vibrationDesc}
                </p>
              </div>
            </div>
            <button
              onClick={() => onVibrationChange(!vibrationEnabled)}
              className={`h-6 w-12 rounded-full transition-all ${vibrationEnabled ? "bg-green-500" : "bg-slate-300 dark:bg-gray-600"}`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] transition-all ${vibrationEnabled ? "translate-x-6" : "translate-x-0.5"}`}
              ></div>
            </button>
          </div>

          <div className="bg-accent/10 dark:bg-accent/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-accent text-sm">info</span>
              <p className="text-accent dark:text-accent text-xs">{t.rider.modals.alertsInfo}</p>
            </div>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-4">
            <p className="mb-3 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
              {t.rider.modals.developerTools}
            </p>
            <button
              onClick={onClearOrders}
              className="bg-status-error/10 dark:bg-status-error/20 text-status-error hover:bg-status-error/20 dark:hover:bg-status-error/30 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              {t.rider.modals.clearPendingOrders}
            </button>
            <p className="mt-2 text-center text-[10px] text-[var(--color-outline-variant)] italic">
              {t.rider.modals.clearPendingDesc}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="bg-brand-secondary mt-4 w-full rounded-xl py-3 font-bold text-white"
        >
          {t.rider.modals.saveSettings}
        </button>
      </div>
    </div>
  );
}
