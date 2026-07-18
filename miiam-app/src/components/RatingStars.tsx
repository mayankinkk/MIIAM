"use client";

import { motion } from "framer-motion";

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export default function RatingStars({
  rating,
  max = 5,
  size = "md",
  showValue = false,
  interactive = false,
  onChange,
}: RatingStarsProps) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl" };
  const sizeClass = sizes[size];

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;

        return (
          <motion.button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            whileHover={interactive ? { scale: 1.2 } : undefined}
            whileTap={interactive ? { scale: 0.9 } : undefined}
            className={`${sizeClass} ${interactive ? "cursor-pointer" : "cursor-default"} leading-none`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: filled || half ? "'FILL' 1" : "'FILL' 0",
                color: filled || half ? "#f59e0b" : "#d1d5db",
              }}
            >
              {filled ? "star" : half ? "star_half" : "star"}
            </span>
          </motion.button>
        );
      })}
      {showValue && (
        <span className={`ml-1 font-bold text-on-surface ${size === "sm" ? "text-xs" : "text-sm"}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
