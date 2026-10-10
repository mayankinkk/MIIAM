"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";

export default function CartSummary() {
  const items = useCartStore((s) => s.items);
  const totalItems = Array.isArray(items) ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  const totalPrice = Array.isArray(items)
    ? items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    : 0;

  if (totalItems === 0) return null;

  return (
    <Link
      href="/app/cart"
      className="bg-primary text-on-primary shadow-primary/20 fixed right-4 bottom-20 left-4 z-30 flex items-center justify-between rounded-2xl p-4 shadow-xl transition-transform active:scale-[0.98] md:right-6 md:bottom-6 md:left-auto md:max-w-sm"
    >
      <div className="flex items-center gap-3">
        <div className="bg-on-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
          <span className="material-symbols-outlined">shopping_cart</span>
        </div>
        <div>
          <p className="text-sm font-bold">
            {totalItems} item{totalItems > 1 ? "s" : ""}
          </p>
          <p className="text-xs opacity-80">View cart</p>
        </div>
      </div>
      <span className="text-lg font-black">₹{totalPrice.toFixed(0)}</span>
    </Link>
  );
}
