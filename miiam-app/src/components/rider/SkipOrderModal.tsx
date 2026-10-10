"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface SkipOrderModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SkipOrderModal({ open, onConfirm, onCancel }: SkipOrderModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="skip-order-title"
        className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6"
      >
        <h3 id="skip-order-title" className="mb-2 text-center text-xl font-bold">
          {t.rider.modals.skipOrder}
        </h3>
        <p className="mb-6 text-center text-sm text-[var(--color-outline)]">
          {t.rider.modals.skipOrderDesc}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl bg-[var(--color-surface-container-high)] py-3 font-bold text-[var(--color-on-surface-variant)]"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="bg-status-error flex-1 rounded-xl py-3 font-bold text-white"
          >
            {t.rider.modals.skip}
          </button>
        </div>
      </div>
    </div>
  );
}
