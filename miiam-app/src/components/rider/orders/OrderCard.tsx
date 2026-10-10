"use client";

import type { Order } from "./types";

interface OrderCardProps {
  order: Order;
  onAccept: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export default function OrderCard({ order, onAccept, isSelected, onToggleSelect }: OrderCardProps) {
  const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const estimatedEarning = order.total_amount + (order.delivery_fee || 0);

  return (
    <div className="hover:border-brand-secondary/30 rounded-2xl border-2 border-transparent bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggleSelect}
            className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full border-2 ${isSelected ? "bg-brand-secondary border-brand-secondary" : "border-[var(--color-outline-variant)]"}`}
            aria-label="Select order"
            aria-pressed={isSelected}
          >
            {isSelected && (
              <span className="material-symbols-outlined text-sm text-white">check</span>
            )}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[var(--color-on-surface)]">
                {order.vendor?.shop_name || order.vendor?.name}
              </h3>
              <span className="text-brand-secondary bg-secondary-container/50 rounded-full px-2 py-0.5 text-[10px] font-bold">
                For {order.customer_name || "Customer"}
              </span>
            </div>
            <p className="flex items-center gap-1 text-xs text-[var(--color-outline-variant)]">
              <span className="material-symbols-outlined text-xs">store</span>
              {order.vendor?.address}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-green-600">₹{estimatedEarning}</p>
          <p className="text-[10px] text-[var(--color-outline-variant)]">{totalItems} items</p>
        </div>
      </div>

      <div className="mb-3 rounded-lg bg-[var(--color-surface-subtle)] p-2">
        <p className="mb-1 text-[10px] text-[var(--color-outline-variant)]">📍 DELIVER TO:</p>
        <p className="text-sm">{order.address?.street}</p>
      </div>

      {order.special_instructions && (
        <div className="bg-status-warning/10 text-status-warning mb-3 rounded-lg p-2 text-xs">
          📝 {order.special_instructions}
        </div>
      )}

      <div className="flex gap-2">
        <a
          href={`tel:${order.customer_phone}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--color-surface-container)] py-2 text-center text-sm font-bold text-[var(--color-on-surface)]"
        >
          <span className="material-symbols-outlined text-sm">call</span>
          Call
        </a>
        <button
          onClick={onAccept}
          className="bg-brand-secondary flex-[2] rounded-lg py-2 text-sm font-bold text-white"
        >
          Start Shopping
        </button>
      </div>
    </div>
  );
}
