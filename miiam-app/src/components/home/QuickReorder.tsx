"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import { getVendorMenuTable } from "@/lib/vendor";
import logger from "@/lib/logger";

interface LastOrder {
  id: string;
  vendor_id: string;
  vendor_name: string;
  items: string;
  total: number;
  placed_at: string;
}

interface QuickReorderProps {
  order: LastOrder;
}

export default function QuickReorder({ order }: QuickReorderProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const addItem = useCartStore((s) => s.addItem);
  const addToast = useToastStore((s) => s.addToast);
  const [reordering, setReordering] = useState(false);

  const handleReorder = async () => {
    setReordering(true);
    try {
      type ReorderItem = {
        menu_item_id: string;
        name?: string;
        quantity: number;
        unit_price: number;
      };
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("menu_item_id, name, quantity, unit_price")
        .eq("order_id", order.id);

      const items: ReorderItem[] = (orderItems as ReorderItem[] | null) || [];
      if (items.length === 0) {
        addToast("Could not load items from that order.", "error");
        return;
      }

      const table = await getVendorMenuTable(order.vendor_id);
      const ids = items.map((i) => i.menu_item_id);
      const { data: menuItems } = await supabase
        .from(table)
        .select("id, name, image_url")
        .in("id", ids);

      const menuMap = new Map<string, { name: string; image_url?: string }>();
      if (menuItems) {
        menuItems.forEach((mi: { id: string; name: string; image_url?: string }) =>
          menuMap.set(mi.id, mi)
        );
      }

      for (const item of items) {
        const mi = menuMap.get(item.menu_item_id);
        for (let i = 0; i < item.quantity; i++) {
          addItem({
            id: item.menu_item_id,
            menu_item_id: item.menu_item_id,
            vendor_id: order.vendor_id,
            vendor_name: order.vendor_name,
            name: mi?.name || item.name || "Item",
            price: item.unit_price,
            image_url: mi?.image_url || undefined,
          });
        }
      }

      addToast(`${items.length} item${items.length > 1 ? "s" : ""} added to cart`, "success");
      try {
        navigator.vibrate?.([10, 50, 20]);
      } catch {
        /* ignore */
      }
      router.push("/app/cart");
    } catch (error) {
      logger.error({ err: error }, "Home quick reorder failed");
      addToast("Failed to reorder. Please try again.", "error");
    } finally {
      setReordering(false);
    }
  };

  return (
    <button
      onClick={handleReorder}
      disabled={reordering}
      className="bg-primary text-on-primary flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-transform active:scale-95 disabled:opacity-60"
    >
      {reordering ? (
        <>
          <span className="border-on-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
          Adding…
        </>
      ) : (
        "Reorder"
      )}
    </button>
  );
}
