"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";

interface QuickReorderProps {
  items: Array<{
    menu_item_id: string;
    name: string;
    price: number;
    image_url?: string;
    is_veg?: boolean;
    vendor_id: string;
    vendor_name?: string;
    quantity: number;
  }>;
  vendorId: string;
  vendorName: string;
}

export default function QuickReorder({ items, vendorId, vendorName }: QuickReorderProps) {
  const router = useRouter();
  const { addItem, items: cartItems, clearCart } = useCartStore();
  const addToast = useToastStore((s) => s.addToast);

  const handleReorder = async () => {
    if (cartItems.length > 0) {
      clearCart();
    }

    items.forEach((item) => {
      addItem({
        id: item.menu_item_id,
        menu_item_id: item.menu_item_id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        is_veg: item.is_veg,
        vendor_id: vendorId,
        vendor_name: vendorName,
      }, item.quantity, true);
    });

    addToast(`${items.length} item${items.length > 1 ? "s" : ""} added to cart`, "success");
    try { navigator.vibrate?.([10, 50, 20]); } catch {}
    router.push("/app/cart");
  };

  return (
    <button
      onClick={handleReorder}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold hover:bg-primary/20 transition-colors active:scale-95"
    >
      <span className="material-symbols-outlined text-xs">replay</span>
      Reorder
    </button>
  );
}
