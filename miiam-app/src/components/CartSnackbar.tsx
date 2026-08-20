"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCartSnackbarStore } from "@/lib/store/cartSnackbarStore";
import { useCartStore } from "@/lib/store/cartStore";

export default function CartSnackbar() {
  const { visible, itemName, itemImage, itemPrice, hideSnackbar } = useCartSnackbarStore();
  const router = useRouter();
  const pathname = usePathname();
  const totalItems = useCartStore((s) =>
    Array.isArray(s.items) ? s.items.reduce((sum, i) => sum + i.quantity, 0) : 0
  );
  const totalPrice = useCartStore((s) =>
    Array.isArray(s.items)
      ? s.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      : 0
  );

  const isOnCartPage = pathname === "/app/cart";
  const show = visible && !isOnCartPage;

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => hideSnackbar(), 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, hideSnackbar]);

  const handleViewCart = useCallback(() => {
    hideSnackbar();
    router.push("/app/cart");
  }, [hideSnackbar, router]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed left-3 right-3 z-[60] md:left-auto md:right-6 md:max-w-md"
          style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="bg-emerald-600 text-white rounded-2xl px-3 py-3 flex items-center gap-2 shadow-lg shadow-emerald-600/25">
            {itemImage ? (
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/20 shrink-0">
                <Image
                  src={itemImage}
                  alt={itemName}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-xl">
                  shopping_cart
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{itemName}</p>
              <p className="text-[11px] text-white/80">
                {totalItems} item{totalItems !== 1 ? "s" : ""} • ₹{totalPrice.toLocaleString("en-IN")}
              </p>
            </div>

            <button
              onClick={handleViewCart}
              className="bg-white text-emerald-600 text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-white/90 active:scale-95 transition-all shrink-0"
            >
              View Cart
            </button>

            <button
              onClick={hideSnackbar}
              className="p-1 rounded-full hover:bg-white/20 transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-white text-base">
                close
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
