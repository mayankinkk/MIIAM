"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingPromoProps {
  message: string;
  icon?: string;
  href?: string;
  dismissible?: boolean;
  duration?: number;
}

export default function FloatingPromo({ message, icon = "local_offer", href, dismissible = true, duration = 8000 }: FloatingPromoProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="mx-4 mb-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-3 flex items-center gap-3 shadow-lg shadow-amber-500/20"
        >
          {href ? (
            <a href={href} className="flex items-center gap-3 flex-1 min-w-0">
              <span className="material-symbols-outlined shrink-0">{icon}</span>
              <p className="text-xs font-bold truncate">{message}</p>
            </a>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="material-symbols-outlined shrink-0">{icon}</span>
              <p className="text-xs font-bold truncate">{message}</p>
            </div>
          )}

          {dismissible && (
            <button
              onClick={() => setVisible(false)}
              className="shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
