"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface CancelOrderModalProps {
  open: boolean;
  reasons: string[];
  onSelectReason: (reason: string) => void;
  onClose: () => void;
}

export default function CancelOrderModal({ open, reasons, onSelectReason, onClose }: CancelOrderModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl w-full max-w-sm p-4">
        <h3 className="font-bold text-lg mb-4">{t.rider.modals.declineOrder}</h3>
        <p className="text-sm text-[var(--color-outline)] mb-4">{t.rider.modals.declineOrderReason}</p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {reasons.map((reason) => (
            <button
              key={reason}
              onClick={() => onSelectReason(reason)}
              className="w-full text-left p-3 bg-[var(--color-surface-subtle)] rounded-xl hover:bg-[var(--color-surface-container)] text-sm"
            >
              {reason}
            </button>
          ))}
        </div>
        <button 
          onClick={onClose}
          className="w-full mt-4 py-3 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] font-bold rounded-xl"
        >
{t.common.cancel}
        </button>
      </div>
    </div>
  );
}
