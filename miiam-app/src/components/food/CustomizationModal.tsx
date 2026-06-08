"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store/cartStore";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  description?: string;
};

type CustomizationOption = {
  label: string;
  price: number;
  selected: boolean;
};

type Props = {
  item: MenuItem;
  vendor_id: string;
  vendor_name: string;
  vendor_type?: string;
  onClose: () => void;
  onAdd?: (item: any) => void;
};

const commonCustomizations: Record<string, { label: string; options: { label: string; price: number }[] }> = {
  "Spice Level": {
    label: "Spice Level",
    options: [
      { label: "Mild 🌶️", price: 0 },
      { label: "Medium 🌶️🌶️", price: 0 },
      { label: "Spicy 🌶️🌶️🌶️", price: 0 },
      { label: "Extra Spicy 🌶️🌶️🌶️🌶️", price: 10 },
    ],
  },
  "Size": {
    label: "Size",
    options: [
      { label: "Regular", price: 0 },
      { label: "Large (+50%)", price: 0 },
    ],
  },
  "Add Ons": {
    label: "Add Ons",
    options: [
      { label: "Extra Cheese 🧀", price: 50 },
      { label: "Extra Sauce 🫙", price: 20 },
      { label: "Extra Veggies 🥬", price: 30 },
      { label: "Extra Protein 🍗", price: 60 },
    ],
  },
  "Remove Ingredients": {
    label: "Remove Ingredients",
    options: [
      { label: "No Onions 🧅", price: 0 },
      { label: "No Tomatoes 🍅", price: 0 },
      { label: "No Coriander 🌿", price: 0 },
      { label: "No Spice 🌶️", price: 0 },
    ],
  },
  "Bread Type": {
    label: "Bread Type",
    options: [
      { label: "Regular Roti 🫓", price: 0 },
      { label: "Butter Naan 🧈", price: 20 },
      { label: "Garlic Naan 🧄", price: 25 },
      { label: "Tandoori Roti 🔥", price: 15 },
    ],
  },
  "Rice Type": {
    label: "Rice Type",
    options: [
      { label: "Steamed Rice 🍚", price: 0 },
      { label: "Jeera Rice 🍚", price: 20 },
      { label: "Biryani Rice 🍚", price: 30 },
    ],
  },
};

export default function CustomizationModal({ item, vendor_id, vendor_name, onClose, onAdd }: Props) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleAddToCart = () => {
    if (onAdd) {
      onAdd({
        ...item,
        quantity,
        vendor_id,
        vendor_name,
        price: item.price,
      });
    } else {
      addItem({
        id: item.id + Date.now(),
        menu_item_id: item.id,
        vendor_id,
        vendor_name,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
      }, quantity);
    }
    onClose();
  };

  const totalPrice = item.price * quantity;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-white z-10 border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Add to Cart</h2>
            <p className="text-sm text-slate-500">{item.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-600 text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Item Preview */}
          <div className="flex gap-4 bg-slate-50 rounded-2xl p-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400">restaurant</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-slate-900">{item.name}</h3>
              {item.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
              )}
              <p className="text-base font-extrabold text-[#ba001c] mt-1">₹{item.price}</p>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3">Quantity</h3>
            <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-2 w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-white shadow flex items-center justify-center hover:bg-[#ffe1e4] transition-colors"
              >
                <span className="material-symbols-outlined text-[#ba001c]">remove</span>
              </button>
              <span className="text-xl font-extrabold text-slate-900 w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-white shadow flex items-center justify-center hover:bg-[#ffe1e4] transition-colors"
              >
                <span className="material-symbols-outlined text-[#ba001c]">add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={handleAddToCart}
            className="w-full py-4 bg-[#ba001c] text-white font-extrabold rounded-2xl flex items-center justify-center gap-3 hover:bg-[#a40017] active:scale-95 transition-all shadow-lg shadow-[#ba001c]/30"
          >
            <span className="material-symbols-outlined">add_shopping_cart</span>
            <span>Add to Cart</span>
            <span className="bg-white/20 px-2 py-1 rounded-lg">₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}