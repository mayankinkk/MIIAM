"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface StickyVendorHeaderProps {
  name: string;
  rating?: number;
  cuisine?: string;
  isOpen: boolean;
  vendorId: string;
}

export default function StickyVendorHeader({ name, rating, cuisine, isOpen, vendorId }: StickyVendorHeaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 200);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-sm border-b border-outline/5"
        >
          <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto">
            <Link href="/app/food" className="text-on-surface">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>

            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-on-surface truncate">{name}</h2>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                {rating && <span>★ {typeof rating === "number" ? rating.toFixed(1) : rating}</span>}
                {cuisine && <span className="truncate">{cuisine}</span>}
                <span className={`font-bold ${isOpen ? "text-emerald-600" : "text-gray-400"}`}>
                  {isOpen ? "Open" : "Closed"}
                </span>
              </div>
            </div>

            <Link href="/app/cart" className="relative">
              <span className="material-symbols-outlined text-on-surface">shopping_cart</span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
