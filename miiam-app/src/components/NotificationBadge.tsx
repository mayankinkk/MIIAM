"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationBadgeProps {
  count: number;
  max?: number;
}

export default function NotificationBadge({ count, max = 99 }: NotificationBadgeProps) {
  const [prevCount, setPrevCount] = useState(count);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (count > prevCount) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 500);
      setPrevCount(count);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount]);

  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.span
        key={count}
        initial={{ scale: 0 }}
        animate={{ scale: animating ? [1, 1.4, 1] : 1 }}
        exit={{ scale: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-status-error rounded-full text-white text-[9px] font-black flex items-center justify-center px-1 shadow-md"
      >
        {count > max ? `${max}+` : count}
      </motion.span>
    </AnimatePresence>
  );
}
