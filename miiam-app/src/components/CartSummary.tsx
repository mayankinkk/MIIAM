"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";

export default function CartSummary() {
  const items = useCartStore((s) => s.items);
  const totalItems = Array.isArray(items) ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  const totalPrice = Array.isArray(items) ? items.reduce((sum, i) => sum + i.price * i.quantity, 0) : 0;

  if (totalItems === 0) return null;

  return (
    <Link
      href="/app/cart"
      className="fixed bottom-20 left-4 right-4 z-30 bg-primary text-on-primary rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-on-primary/20 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined">shopping_cart</span>
        </div>
        <div>
          <p className="text-sm font-bold">{totalItems} item{totalItems > 1 ? "s" : ""}</p>
          <p className="text-xs opacity-80">View cart</p>
        </div>
      </div>
      <span className="text-lg font-black">₹{totalPrice.toFixed(0)}</span>
    </Link>
  );
}
