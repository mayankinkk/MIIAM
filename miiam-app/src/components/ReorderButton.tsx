"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

interface OrderHistoryItem {
  id: string;
  vendor_id: string;
  vendor_name: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  total_amount: number;
  created_at: string;
  status: string;
}

interface ReorderButtonProps {
  order: OrderHistoryItem;
}

export function ReorderButton({ order }: ReorderButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { addItem } = useCartStore();
  const { addToast } = useToastStore();

  const handleReorder = async () => {
    setLoading(true);
    
    try {
      const { data: menuItems } = await supabase
        .from("menu_items")
        .select("id, name, price, image_url, vendor_id")
        .eq("vendor_id", order.vendor_id);

      if (!menuItems?.length) {
        addToast("Menu items not available", "error");
        setLoading(false);
        return;
      }

      for (const orderItem of order.items) {
        const menuItem = menuItems.find((m: { id: string; name: string; price: number; image_url: string; vendor_id: string }) =>
          m.name.toLowerCase() === orderItem.name.toLowerCase()
        );
        
        if (menuItem) {
          addItem({
            id: menuItem.id,
            menu_item_id: menuItem.id,
            vendor_id: menuItem.vendor_id,
            vendor_name: order.vendor_name,
            name: menuItem.name,
            price: menuItem.price,
            image_url: menuItem.image_url,
          }, orderItem.quantity);
        }
      }

      router.push("/app/cart");
    } catch (error) {
      logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "Reorder error");
      addToast("Failed to reorder. Please try again.", "error");
    }
    
    setLoading(false);
  };

  return (
    <button
      onClick={handleReorder}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? (
        <>
          <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
          Adding...
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-lg">replay</span>
          Reorder
        </>
      )}
    </button>
  );
}

interface OrderHistoryCardProps {
  order: OrderHistoryItem;
}

export function OrderHistoryCard({ order }: OrderHistoryCardProps) {
  const date = new Date(order.created_at);
  
  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <Link href={`/app/vendor/${order.vendor_id}`} className="font-bold text-[var(--color-on-surface)] hover:text-[var(--color-primary)]">
            {order.vendor_name}
          </Link>
          <p className="text-xs text-[var(--color-outline)]">
            {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
          order.status === "delivered" 
            ? "bg-green-100 text-green-700" 
            : order.status === "cancelled"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700"
        }`}>
          {order.status}
        </span>
      </div>

      <div className="space-y-1 mb-4">
        {order.items.slice(0, 3).map((item, idx) => (
          <p key={idx} className="text-sm text-[var(--color-on-surface-variant)]">
            {item.quantity}x {item.name}
          </p>
        ))}
        {order.items.length > 3 && (
          <p className="text-sm text-[var(--color-outline)]">+{order.items.length - 3} more items</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
        <span className="font-bold text-[var(--color-primary)]">₹{order.total_amount.toFixed(0)}</span>
        <div className="flex gap-2">
          <ReorderButton order={order} />
          <Link 
            href={`/app/orders/${order.id}`}
            className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl font-bold text-sm hover:bg-[var(--color-surface-subtle)]"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}