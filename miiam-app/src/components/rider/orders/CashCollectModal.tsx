"use client";

import type { Order } from "./types";

interface CashCollectModalProps {
  open: boolean;
  cashToCollect: number;
  onCashToCollectChange: (value: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function CashCollectModal({ open, cashToCollect, onCashToCollectChange, onConfirm, onClose }: CashCollectModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-status-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-status-success text-4xl">payments</span>
          </div>
          <h3 className="font-bold text-xl">Collect Payment</h3>
        </div>
        <div className="bg-status-success/10 p-4 rounded-xl mb-4">
          <p className="text-sm text-status-success">Amount to collect from customer:</p>
          <p className="text-3xl font-black text-status-success">₹{cashToCollect}</p>
        </div>
        <div className="space-y-2 mb-4">
          <button onClick={() => onCashToCollectChange(cashToCollect + 10)} className="w-full py-2 border border-[var(--color-border-subtle)] rounded-lg font-bold">+₹10</button>
          <button onClick={() => onCashToCollectChange(cashToCollect + 50)} className="w-full py-2 border border-[var(--color-border-subtle)] rounded-lg font-bold">+₹50</button>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] font-bold rounded-xl">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-status-success text-white font-bold rounded-xl">Confirm & Complete</button>
        </div>
      </div>
    </div>
  );
}
