"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedPriceProps {
  value: number;
  prefix?: string;
  className?: string;
}

export default function AnimatedPrice({ value, prefix = "₹", className = "" }: AnimatedPriceProps) {
  const [displayValue, setDisplayValue] = useState(`${prefix}${value.toFixed(0)}`);
  const prevValue = useRef(value);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    const duration = 400;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplayValue(`${prefix}${current.toFixed(0)}`);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value, prefix]);

  return (
    <motion.span
      key={value}
      initial={{ scale: 1.1 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className={`font-black tabular-nums ${className}`}
    >
      {displayValue}
    </motion.span>
  );
}
