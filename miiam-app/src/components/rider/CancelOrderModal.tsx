"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface CancelOrderModalProps {
  open: boolean;
  reasons: string[];
  onSelectReason: (reason: string) => void;
  onClose: () => void;
}

export default function CancelOrderModal({
  open,
  reasons,
  onSelectReason,
  onClose,
}: CancelOrderModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-4">
        <h3 className="mb-4 text-lg font-bold">{t.rider.modals.declineOrder}</h3>
        <p className="mb-4 text-sm text-[var(--color-outline)]">
          {t.rider.modals.declineOrderReason}
        </p>
        <div className="max-h-60 space-y-2 overflow-y-auto">
          {reasons.map((reason) => (
            <button
              key={reason}
              onClick={() => onSelectReason(reason)}
              className="w-full rounded-xl bg-[var(--color-surface-subtle)] p-3 text-left text-sm hover:bg-[var(--color-surface-container)]"
            >
              {reason}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-[var(--color-surface-container-high)] py-3 font-bold text-[var(--color-on-surface-variant)]"
        >
          {t.common.cancel}
        </button>
      </div>
    </div>
  );
}
