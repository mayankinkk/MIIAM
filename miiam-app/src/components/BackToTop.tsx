"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="bg-primary text-on-primary shadow-primary/30 fixed right-4 bottom-24 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90 md:bottom-6"
          aria-label="Back to top"
        >
          <span className="material-symbols-outlined text-xl">arrow_upward</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
