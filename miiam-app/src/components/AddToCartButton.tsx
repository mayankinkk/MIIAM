"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AddToCartButtonProps {
  onAdd: () => void;
  label?: string;
  icon?: string;
  className?: string;
  ariaLabel?: string;
  size?: "sm" | "md" | "lg";
}

export default function AddToCartButton({
  onAdd,
  label,
  icon = "add",
  className = "",
  ariaLabel,
  size = "md",
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isAdding) return;

      setIsAdding(true);
      onAdd();
      if (navigator.vibrate) navigator.vibrate([15, 8, 15]);

      setTimeout(() => {
        setShowCheck(true);
        setTimeout(() => {
          setIsAdding(false);
          setShowCheck(false);
        }, 600);
      }, 150);
    },
    [onAdd, isAdding]
  );

  const sizeClasses = {
    sm: "w-8 h-8 text-lg",
    md: "w-10 h-10 text-xl",
    lg: "w-12 h-12 text-2xl",
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.85 }}
      animate={isAdding ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative ${sizeClasses[size]} bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 z-10 ${className}`}
      aria-label={ariaLabel || label || "Add to cart"}
    >
      <AnimatePresence mode="wait">
        {showCheck ? (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 400 }}
            className="material-symbols-outlined"
          >
            check
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={isAdding ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="material-symbols-outlined"
          >
            {icon}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
