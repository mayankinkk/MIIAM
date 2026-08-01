"use client";

interface VegNonVegBadgeProps {
  isVeg: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function VegNonVegBadge({ isVeg, size = "md", className = "" }: VegNonVegBadgeProps) {
  const sizes = {
    sm: { outer: "w-3.5 h-3.5", inner: "w-1.5 h-1.5", border: "border" },
    md: { outer: "w-4 h-4", inner: "w-2 h-2", border: "border-[1.5px]" },
    lg: { outer: "w-5 h-5", inner: "w-2.5 h-2.5", border: "border-2" },
  };

  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center justify-center ${s.outer} ${s.border} rounded-sm flex-shrink-0 ${
        isVeg ? "border-green-600" : "border-red-600"
      } ${className}`}
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
      title={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span
        className={`rounded-full ${s.inner} ${isVeg ? "bg-green-600" : "bg-red-600"}`}
      />
    </span>
  );
}
