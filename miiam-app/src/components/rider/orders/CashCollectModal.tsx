"use client";

import type { Order } from "./types";

interface CashCollectModalProps {
  open: boolean;
  cashToCollect: number;
  onCashToCollectChange: (value: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CashCollectModal({
  open,
  cashToCollect,
  onCashToCollectChange,
  onConfirm,
  onClose,
}: CashCollectModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6">
        <div className="mb-4 text-center">
          <div className="bg-status-success/10 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
            <span className="material-symbols-outlined text-status-success text-4xl">payments</span>
          </div>
          <h3 className="text-xl font-bold">Collect Payment</h3>
        </div>
        <div className="bg-status-success/10 mb-4 rounded-xl p-4">
          <p className="text-status-success text-sm">Amount to collect from customer:</p>
          <p className="text-status-success text-3xl font-black">₹{cashToCollect}</p>
        </div>
        <div className="mb-4 space-y-2">
          <button
            onClick={() => onCashToCollectChange(cashToCollect + 10)}
            className="w-full rounded-lg border border-[var(--color-border-subtle)] py-2 font-bold"
          >
            +₹10
          </button>
          <button
            onClick={() => onCashToCollectChange(cashToCollect + 50)}
            className="w-full rounded-lg border border-[var(--color-border-subtle)] py-2 font-bold"
          >
            +₹50
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-[var(--color-surface-container-high)] py-3 font-bold text-[var(--color-on-surface-variant)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-status-success flex-1 rounded-xl py-3 font-bold text-white"
          >
            Confirm & Complete
          </button>
        </div>
      </div>
    </div>
  );
}
