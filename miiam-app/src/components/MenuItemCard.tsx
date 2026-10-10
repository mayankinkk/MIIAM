"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import BlurImage from "@/components/BlurImage";

interface MenuItemCardProps {
  item: {
    id: string;
    name: string;
    price: number;
    original_price?: number;
    image_url?: string;
    is_veg?: boolean;
    description?: string;
    is_featured?: boolean;
  };
  quantity?: number;
  onAdd?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  index?: number;
}

export default memo(function MenuItemCard({
  item,
  quantity = 0,
  onAdd,
  onIncrement,
  onDecrement,
  index = 0,
}: MenuItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-surface-container-lowest flex items-center gap-3 rounded-xl p-3 shadow-sm"
    >
      {/* Image */}
      <div className="bg-surface-container relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
        {item.image_url ? (
          <BlurImage
            src={item.image_url}
            alt={item.name}
            fill
            className="h-full w-full"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-outline-variant text-2xl">
              fastfood
            </span>
          </div>
        )}
        {/* Veg indicator */}
        {item.is_veg !== undefined && (
          <span
            className={`absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-sm border-2 ${
              item.is_veg ? "border-green-600 bg-white" : "border-red-600 bg-white"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${item.is_veg ? "bg-green-600" : "bg-red-600"}`}
            />
          </span>
        )}
        {item.is_featured && (
          <span className="absolute top-1 right-1 rounded bg-amber-500 px-1 text-[8px] font-black text-white">
            ★
          </span>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <h4 className="text-on-surface truncate text-sm font-bold">{item.name}</h4>
        {item.description && (
          <p className="text-on-surface-variant/60 mt-0.5 truncate text-[10px]">
            {item.description}
          </p>
        )}
        <div className="mt-1.5 flex flex-col items-start leading-tight">
          <span className="text-on-surface text-sm font-extrabold">₹{item.price}</span>
          {item.original_price && item.original_price > item.price && (
            <span className="text-on-surface-variant/60 text-[11px] line-through">
              ₹{item.original_price}
            </span>
          )}
        </div>
      </div>

      {/* Add/Quantity */}
      <div className="shrink-0">
        {quantity === 0 ? (
          <button
            onClick={onAdd}
            className="bg-primary text-on-primary border-primary h-8 min-w-[52px] rounded-lg border px-3 text-xs font-extrabold transition-all hover:brightness-95 active:scale-95"
          >
            ADD
          </button>
        ) : (
          <div className="bg-surface-container-lowest border-primary flex items-center overflow-hidden rounded-lg border">
            <button
              onClick={onDecrement}
              className="bg-primary text-on-primary flex h-8 w-8 items-center justify-center transition-colors hover:brightness-95"
            >
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <span className="text-on-surface w-7 text-center text-xs font-extrabold">
              {quantity}
            </span>
            <button
              onClick={onIncrement}
              className="bg-primary text-on-primary flex h-8 w-8 items-center justify-center transition-colors hover:brightness-95"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
});
