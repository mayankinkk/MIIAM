"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface CallModalProps {
  open: boolean;
  onClose: () => void;
  name?: string;
  phone?: string;
}

export default function CallModal({ open, onClose, name, phone }: CallModalProps) {
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
        aria-labelledby="call-modal-title"
        className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="call-modal-title" className="text-lg font-bold">
            {t.rider.callModal.call}
          </h3>
          <button onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="py-6 text-center">
          <div className="bg-brand-secondary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <span className="material-symbols-outlined text-brand-secondary text-3xl">person</span>
          </div>
          <p className="mb-1 font-bold">{name || t.rider.callModal.vendor}</p>
          <p className="text-sm text-[var(--color-outline)]">{phone}</p>
        </div>
        <a
          href={`tel:${phone}`}
          className="bg-status-success flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white"
        >
          <span className="material-symbols-outlined">call</span>
          {t.rider.callModal.callNow}
        </a>
      </div>
    </div>
  );
}
