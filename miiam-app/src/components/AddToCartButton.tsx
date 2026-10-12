"use client";

import { useCartStore } from "@/lib/store/cartStore";

interface CartItemInput {
  menu_item_id: string;
  vendor_id: string;
  vendor_name: string;
  name: string;
  price: number;
  image_url?: string;
  is_veg?: boolean;
}

interface AddToCartButtonProps {
  item: CartItemInput;
  className?: string;
  size?: "sm" | "md";
}

export default function AddToCartButton({ item, className = "", size = "md" }: AddToCartButtonProps) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantityByMenuItem = useCartStore((s) => s.updateQuantityByMenuItem);

  const cartItem = Array.isArray(items)
    ? items.find((i) => i.menu_item_id === item.menu_item_id && i.name === item.name)
    : undefined;
  const qty = cartItem?.quantity ?? 0;

  const btnSize = size === "sm" ? "h-7 px-3 text-[11px]" : "h-8 px-4 text-xs";

  const handleAdd = () => {
    addItem({ ...item, id: item.menu_item_id }, 1);
  };

  if (qty === 0) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleAdd();
        }}
        aria-label={`Add ${item.name} to cart`}
        className={`bg-primary text-on-primary inline-flex items-center gap-1 rounded-full font-bold transition-transform active:scale-95 ${btnSize} ${className}`}
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          add
        </span>
        ADD
      </button>
    );
  }

  return (
    <div
      className={`bg-primary text-on-primary inline-flex items-center rounded-full font-bold ${btnSize} ${className}`}
      role="group"
      aria-label={`Quantity of ${item.name}`}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          updateQuantityByMenuItem(item.menu_item_id, qty - 1);
        }}
        aria-label={`Decrease quantity`}
        className="flex h-full w-7 items-center justify-center transition-transform active:scale-90"
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          remove
        </span>
      </button>
      <span className="min-w-[1.25rem] text-center text-xs tabular-nums" suppressHydrationWarning>
        {qty}
      </span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          updateQuantityByMenuItem(item.menu_item_id, qty + 1);
        }}
        aria-label={`Increase quantity`}
        className="flex h-full w-7 items-center justify-center transition-transform active:scale-90"
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          add
        </span>
      </button>
    </div>
  );
}
