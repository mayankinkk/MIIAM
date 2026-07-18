"use client";

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

export default function MenuItemCard({ item, quantity = 0, onAdd, onIncrement, onDecrement, index = 0 }: MenuItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 bg-surface-container-lowest rounded-xl p-3 shadow-sm"
    >
      {/* Image */}
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container relative">
        {item.image_url ? (
          <BlurImage src={item.image_url} alt={item.name} fill className="w-full h-full" sizes="80px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-outline-variant text-2xl">fastfood</span>
          </div>
        )}
        {/* Veg indicator */}
        {item.is_veg !== undefined && (
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
            item.is_veg ? "border-green-600 bg-white" : "border-red-600 bg-white"
          }`}>
            <span className={`w-2 h-2 rounded-full ${item.is_veg ? "bg-green-600" : "bg-red-600"}`} />
          </span>
        )}
        {item.is_featured && (
          <span className="absolute top-1 right-1 bg-amber-500 text-white text-[8px] font-black px-1 rounded">★</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-on-surface text-sm truncate">{item.name}</h4>
        {item.description && (
          <p className="text-[10px] text-on-surface-variant/60 truncate mt-0.5">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-black text-primary">₹{item.price}</span>
          {item.original_price && item.original_price > item.price && (
            <span className="text-xs text-on-surface-variant/40 line-through">₹{item.original_price}</span>
          )}
        </div>
      </div>

      {/* Add/Quantity */}
      <div className="shrink-0">
        {quantity === 0 ? (
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors active:scale-95"
          >
            ADD
          </button>
        ) : (
          <div className="flex items-center bg-primary text-on-primary rounded-xl overflow-hidden">
            <button onClick={onDecrement} className="w-9 h-9 flex items-center justify-center hover:bg-primary/80 transition-colors">
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <span className="w-8 text-center text-sm font-bold">{quantity}</span>
            <button onClick={onIncrement} className="w-9 h-9 flex items-center justify-center hover:bg-primary/80 transition-colors">
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
