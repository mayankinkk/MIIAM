"use client";

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  size?: "sm" | "md" | "lg";
  showSavings?: boolean;
}

export default function PriceDisplay({ price, originalPrice, size = "md", showSavings = true }: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  const savings = hasDiscount ? originalPrice - price : 0;
  const discountPercent = hasDiscount ? Math.round((savings / originalPrice) * 100) : 0;

  const sizes = {
    sm: { price: "text-sm", original: "text-xs", badge: "text-[9px] px-1.5 py-0.5" },
    md: { price: "text-base", original: "text-xs", badge: "text-[10px] px-2 py-0.5" },
    lg: { price: "text-xl", original: "text-sm", badge: "text-xs px-2 py-1" },
  };

  const s = sizes[size];

  return (
    <div className="flex flex-col items-start leading-tight">
      <span className={`font-black text-on-surface ${s.price}`}>₹{price.toFixed(0)}</span>
      {hasDiscount && (
        <span className={`font-medium text-on-surface-variant/50 line-through ${s.original}`}>₹{originalPrice.toFixed(0)}</span>
      )}
      {hasDiscount && showSavings && (
        <span className={`font-bold text-deal bg-deal/10 rounded-full mt-0.5 ${s.badge}`}>
          {discountPercent}% off
        </span>
      )}
    </div>
  );
}
