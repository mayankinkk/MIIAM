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
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 shadow-lg border-2 border-transparent hover:border-brand-secondary/30">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-3">
          <button onClick={onToggleSelect} className={`mt-1 w-10 h-10 rounded-full border-2 flex items-center justify-center ${isSelected ? "bg-brand-secondary border-brand-secondary" : "border-[var(--color-outline-variant)]"}`}>
            {isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[var(--color-on-surface)]">{order.vendor?.name}</h3>
              <span className="text-[10px] font-bold text-brand-secondary bg-[#c4d0ff]/50 px-2 py-0.5 rounded-full">For {order.customer_name || "Customer"}</span>
            </div>
            <p className="text-xs text-[var(--color-outline-variant)] flex items-center gap-1">
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
      
      <div className="bg-[var(--color-surface-subtle)] rounded-lg p-2 mb-3">
        <p className="text-[10px] text-[var(--color-outline-variant)] mb-1">📍 DELIVER TO:</p>
        <p className="text-sm">{order.address?.street}</p>
      </div>

      {order.special_instructions && (
        <div className="bg-amber-50 text-amber-800 text-xs p-2 rounded-lg mb-3">
          📝 {order.special_instructions}
        </div>
      )}

      <div className="flex gap-2">
        <a href={`tel:${order.customer_phone}`} className="flex-1 py-2 bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-bold rounded-lg text-center text-sm flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-sm">call</span>
          Call
        </a>
        <button onClick={onAccept} className="flex-[2] bg-brand-secondary text-white py-2 rounded-lg font-bold text-sm">
          Start Shopping
        </button>
      </div>
    </div>
  );
}
