"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface SkipOrderModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SkipOrderModal({ open, onConfirm, onCancel }: SkipOrderModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-xl text-center mb-2">{t.rider.modals.skipOrder}</h3>
        <p className="text-sm text-[var(--color-outline)] text-center mb-6">{t.rider.modals.skipOrderDesc}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] font-bold rounded-xl"
          >
{t.common.cancel}
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl"
          >
{t.rider.modals.skip}
          </button>
        </div>
      </div>
    </div>
  );
}
