"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-urls";
import { useCartSnackbarStore } from "@/lib/store/cartSnackbarStore";
import { useCartStore } from "@/lib/store/cartStore";

const HIDDEN_ON = ["/app/cart", "/app/checkout", "/app/payment", "/app/payment-status"];

export default function CartSnackbar() {
  const { visible, itemName, itemImage, hideSnackbar } = useCartSnackbarStore();
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

  const hideHere = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const show = totalItems > 0 && !hideHere;
  const justAdded = visible && show && Boolean(itemName);

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
          <div className="bg-primary text-on-primary rounded-2xl px-3 py-2.5 flex items-center gap-3 shadow-lg shadow-black/20">
            {justAdded && itemImage ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/30 shrink-0">
                <Image
                  src={itemImage}
                  alt={itemName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized={!canOptimizeImage(itemImage)}
                />
              </div>
            ) : (
              <span className="material-symbols-outlined text-[22px] shrink-0" aria-hidden="true">
                shopping_cart
              </span>
            )}

            <div className="min-w-0 flex-1">
              {justAdded ? (
                <>
                  <p className="text-xs font-bold truncate">{itemName}</p>
                  <p className="text-[11px] text-on-primary/70">
                    {totalItems} item{totalItems !== 1 ? "s" : ""} · ₹{totalPrice.toLocaleString("en-IN")}
                  </p>
                </>
              ) : (
                <p className="text-sm font-extrabold truncate">
                  {totalItems} item{totalItems !== 1 ? "s" : ""} · ₹{totalPrice.toLocaleString("en-IN")}
                </p>
              )}
            </div>

            <button
              onClick={handleViewCart}
              className="bg-on-primary text-primary text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-0.5 hover:opacity-90 active:scale-95 transition-all shrink-0"
            >
              View cart
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                chevron_right
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
