"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface OrderItem {
  quantity: number;
  price?: number;
  menu_item?: { name: string } | null;
  special_notes?: string | null;
  [key: string]: unknown;
}

interface OrderRecord {
  id: string;
  vendor_id: string;
  status: string;
  total_amount?: number;
  vendor?: { name?: string; shop_name?: string } | null;
  items?: OrderItem[];
  [key: string]: unknown;
}

interface OrderItemsListProps {
  order: OrderRecord;
  onChatVendor: () => void;
}

export default function OrderItemsList({ order, onChatVendor }: OrderItemsListProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="bg-surface-container rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm text-primary">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                restaurant
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-on-surface">{order.vendor?.shop_name || order.vendor?.name || "Restaurant"}</h3>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onChatVendor}
            className="text-secondary font-bold text-sm flex items-center gap-1 hover:underline"
          >
            <span className="material-symbols-outlined text-base">chat_bubble</span>
            Chat
          </button>
        </div>
        <div className="bg-white/50 dark:bg-[var(--color-surface)]/50 rounded-2xl p-4 space-y-3">
          {order.items?.map((item: OrderItem, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant font-medium">{item.quantity}x {item.menu_item?.name || "Item"}</span>
              <span className="font-bold text-on-surface">₹{item.price?.toFixed(2) || "0.00"}</span>
            </div>
          ))}
          <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
            <span className="text-on-surface font-bold">{t.orders.totalInclDelivery}</span>
            <span className="text-lg font-black text-primary">₹{order.total_amount?.toFixed(2) || "0.00"}</span>
          </div>
        </div>
      </div>
    </>
  );
}
