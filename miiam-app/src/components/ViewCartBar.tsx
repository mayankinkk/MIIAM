"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";
import { AnimatePresence, motion } from "framer-motion";

export default function ViewCartBar() {
  const items = useCartStore((s) => s.items);
  const totalItems = Array.isArray(items)
    ? items.reduce((sum, i) => sum + (Number.isFinite(i.quantity) ? i.quantity : 0), 0)
    : 0;
  const totalPrice = Array.isArray(items)
    ? items.reduce((sum, i) => {
        const price = Number.isFinite(i.price) ? i.price : 0;
        const qty = Number.isFinite(i.quantity) ? i.quantity : 0;
        return sum + price * qty;
      }, 0)
    : 0;

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-16 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
          style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <Link
            href="/app/cart"
            className="bg-accent text-on-primary flex items-center justify-between rounded-2xl px-4 py-3 shadow-2xl transition-transform active:scale-[0.98]"
            aria-label={`View cart, ${totalItems} items, ₹${totalPrice}`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined text-xl" aria-hidden="true">
                  shopping_cart
                </span>
                <span
                  className="bg-on-primary text-accent absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-black"
                  suppressHydrationWarning
                >
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold" suppressHydrationWarning>
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </p>
                <p className="text-[11px] font-medium opacity-90" suppressHydrationWarning>
                  ₹{totalPrice}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold">
              View Cart
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                arrow_forward
              </span>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
