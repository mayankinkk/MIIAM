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
    const finalReason =
      cancelReason === "Other" && cancelOtherReason.trim()
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
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
        className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-4 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="cancel-modal-title" className="text-on-surface text-xl font-black">
            {t.orders.cancelOrder}
          </h2>
          <button
            onClick={onClose}
            className="bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-full"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="text-on-surface-variant mb-4 text-sm">
          Please tell us why you&apos;re cancelling:
        </p>
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
                className={`w-full rounded-xl p-3 text-left text-sm font-medium transition-all ${
                  cancelReason === reason
                    ? "bg-status-error/10 dark:bg-status-error/20 text-status-error dark:text-status-error border-status-error/20 dark:border-status-error/40 border"
                    : "hover:bg-surface-container-high bg-[var(--color-surface-subtle)] text-[var(--color-on-surface)]"
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
                    className="border-outline-variant/20 flex-1 rounded-xl border bg-[var(--color-surface-subtle)] px-4 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleCancelWithReason}
                    disabled={!cancelOtherReason.trim()}
                    className="bg-status-error rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
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
          className="text-on-surface-variant mt-4 w-full py-3 text-sm font-bold"
        >
          {t.orders.keepOrder}
        </button>
      </div>
    </div>
  );
}
