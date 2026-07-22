"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useToastStore } from "@/lib/store/toastStore";

interface OrderCancelModalProps {
  open: boolean;
  onClose: () => void;
  onCancel: (reason: string) => void;
}

const cancelReasons = [
  "Changed my mind",
  "Found a better price",
  "Delivery time too long",
  "Wrong items ordered",
  "Restaurant unavailable",
  "Payment issue",
  "Other",
];

export default function OrderCancelModal({ open, onClose, onCancel }: OrderCancelModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOtherReason, setCancelOtherReason] = useState("");

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleCancelOrder = (reason: string) => {
    onCancel(reason);
    setCancelReason("");
    setCancelOtherReason("");
  };

  const handleCancelWithReason = () => {
    const finalReason = cancelReason === "Other" && cancelOtherReason.trim()
      ? cancelOtherReason.trim()
      : cancelReason;
    if (!finalReason) {
      addToast(t.refund.selectReason, "error");
      return;
    }
    handleCancelOrder(finalReason);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title" className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 id="cancel-modal-title" className="text-xl font-black text-on-surface">{t.orders.cancelOrder}</h2>
          <button onClick={onClose} className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="text-sm text-on-surface-variant mb-4">Please tell us why you&apos;re cancelling:</p>
        <div className="space-y-2">
          {cancelReasons.map((reason) => (
            <div key={reason}>
              <button
                onClick={() => {
                  if (reason === "Other") {
                    setCancelReason(reason);
                  } else {
                    handleCancelOrder(reason);
                  }
                }}
                className={`w-full text-left p-3 rounded-xl font-medium text-sm transition-all ${
                  cancelReason === reason
                    ? "bg-status-error/10 dark:bg-status-error/20 text-status-error dark:text-status-error border border-status-error/20 dark:border-status-error/40"
                    : "bg-[var(--color-surface-subtle)] text-[var(--color-on-surface)] hover:bg-surface-container-high"
                }`}
              >
                {reason}
              </button>
              {cancelReason === "Other" && reason === "Other" && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={cancelOtherReason}
                    onChange={(e) => setCancelOtherReason(e.target.value)}
                    placeholder="Describe your reason..."
                    aria-label={t.orders.describeReason}
                    className="flex-1 bg-[var(--color-surface-subtle)] border border-outline-variant/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    autoFocus
                  />
                  <button
                    onClick={handleCancelWithReason}
                    disabled={!cancelOtherReason.trim()}
                    className="px-4 py-2 bg-status-error text-white font-bold rounded-xl text-sm disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-on-surface-variant font-bold text-sm"
        >
          {t.orders.keepOrder}
        </button>
      </div>
    </div>
  );
}
