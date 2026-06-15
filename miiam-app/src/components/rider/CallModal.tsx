"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface CallModalProps {
  open: boolean;
  onClose: () => void;
  name?: string;
  phone?: string;
}

export default function CallModal({ open, onClose, name, phone }: CallModalProps) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{t.rider.callModal.call}</h3>
          <button onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-[#0b50d5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[#0b50d5] text-3xl">person</span>
          </div>
          <p className="font-bold mb-1">{name || "{t.rider.callModal.vendor}"}</p>
          <p className="text-sm text-[var(--color-outline)]">{phone}</p>
        </div>
        <a
          href={`tel:${phone}`}
          className="w-full py-4 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">call</span>
          {t.rider.callModal.callNow}
        </a>
      </div>
    </div>
  );
}
