"use client";

import { motion } from "framer-motion";

interface QuantityPillProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
}

export default function QuantityPill({ value, min = 1, max = 99, onChange, size = "md" }: QuantityPillProps) {
  const sizes = size === "sm"
    ? { container: "h-8", button: "w-8 text-sm", text: "text-xs w-8" }
    : { container: "h-10", button: "w-10 text-base", text: "text-sm w-10" };

  return (
    <div className={`flex items-center bg-surface-container rounded-full ${sizes.container}`}>
      <button
        onClick={() => value > min && onChange(value - 1)}
        disabled={value <= min}
        className={`${sizes.button} flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-30`}
        aria-label="Decrease"
      >
        <span className="material-symbols-outlined">remove</span>
      </button>

      <motion.span
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`${sizes.text} font-bold text-on-surface text-center`}
      >
        {value}
      </motion.span>

      <button
        onClick={() => value < max && onChange(value + 1)}
        disabled={value >= max}
        className={`${sizes.button} flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-30`}
        aria-label="Increase"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}
