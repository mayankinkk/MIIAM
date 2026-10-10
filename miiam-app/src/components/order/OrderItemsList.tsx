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
      <div className="bg-surface-container flex flex-col gap-4 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-surface-container-lowest text-accent flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                restaurant
              </span>
            </div>
            <div>
              <h3 className="text-on-surface font-extrabold">
                {order.vendor?.shop_name || order.vendor?.name || "Restaurant"}
              </h3>
              <p className="text-accent text-xs font-bold tracking-widest uppercase">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onChatVendor}
            className="text-secondary flex items-center gap-1 text-sm font-bold hover:underline"
          >
            <span className="material-symbols-outlined text-base">chat_bubble</span>
            Chat
          </button>
        </div>
        <div className="space-y-3 rounded-2xl bg-white/50 p-4 dark:bg-[var(--color-surface)]/50">
          {order.items?.map((item: OrderItem, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant font-medium">
                {item.quantity}x {item.menu_item?.name || "Item"}
              </span>
              <span className="text-on-surface font-bold">₹{item.price?.toFixed(2) || "0.00"}</span>
            </div>
          ))}
          <div className="border-outline-variant/20 flex items-center justify-between border-t pt-3">
            <span className="text-on-surface font-bold">{t.orders.totalInclDelivery}</span>
            <span className="text-on-surface text-lg font-black">
              ₹{order.total_amount?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
