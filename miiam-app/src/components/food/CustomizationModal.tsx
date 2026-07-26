"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store/cartStore";
import BlurImage from "@/components/BlurImage";

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
};

type CustomizationCategory = {
  label: string;
  required?: boolean;
  multi?: boolean;
  options: CustomizationOption[];
};

export interface CustomizationModalCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vendor_id: string;
  vendor_name: string;
  image_url?: string;
}

type Props = {
  item: MenuItem;
  vendor_id: string;
  vendor_name: string;
  vendor_type?: string;
  onClose: () => void;
  onAdd?: (item: CustomizationModalCartItem) => void;
};

const categoryCustomizations: Record<string, CustomizationCategory[]> = {
  Starters: [
    { label: "Spice Level", options: [{ label: "Mild 🌶️", price: 0 }, { label: "Medium 🌶️🌶️", price: 0 }, { label: "Spicy 🌶️🌶️🌶️", price: 0 }, { label: "Extra Spicy 🌶️🌶️🌶️🌶️", price: 10 }] },
    { label: "Add Ons", multi: true, options: [{ label: "Extra Cheese 🧀", price: 50 }, { label: "Extra Sauce 🫙", price: 20 }, { label: "Extra Veggies 🥬", price: 30 }] },
  ],
  "Main Course": [
    { label: "Spice Level", options: [{ label: "Mild 🌶️", price: 0 }, { label: "Medium 🌶️🌶️", price: 0 }, { label: "Spicy 🌶️🌶️🌶️", price: 0 }] },
    { label: "Bread Type", options: [{ label: "Regular Roti 🫓", price: 0 }, { label: "Butter Naan 🧈", price: 20 }, { label: "Garlic Naan 🧄", price: 25 }, { label: "Tandoori Roti 🔥", price: 15 }] },
    { label: "Rice Type", options: [{ label: "Steamed Rice 🍚", price: 0 }, { label: "Jeera Rice 🍚", price: 20 }, { label: "Biryani Rice 🍚", price: 30 }] },
  ],
  Desserts: [
    { label: "Size", options: [{ label: "Regular", price: 0 }, { label: "Large (+50%)", price: 30 }] },
  ],
  Beverages: [
    { label: "Size", options: [{ label: "Small", price: 0 }, { label: "Medium", price: 15 }, { label: "Large", price: 30 }] },
    { label: "Sugar Level", options: [{ label: "No Sugar", price: 0 }, { label: "Low Sugar", price: 0 }, { label: "Regular", price: 0 }] },
  ],
  Bakery: [
    { label: "Size", options: [{ label: "Regular", price: 0 }, { label: "Large", price: 25 }] },
  ],
};

const defaultCustomizations: CustomizationCategory[] = [
  { label: "Spice Level", options: [{ label: "Mild 🌶️", price: 0 }, { label: "Medium 🌶️🌶️", price: 0 }, { label: "Spicy 🌶️🌶️🌶️", price: 0 }] },
  { label: "Add Ons", multi: true, options: [{ label: "Extra Cheese 🧀", price: 50 }, { label: "Extra Sauce 🫙", price: 20 }, { label: "Extra Veggies 🥬", price: 30 }, { label: "Extra Protein 🍗", price: 60 }] },
  { label: "Remove Ingredients", multi: true, options: [{ label: "No Onions 🧅", price: 0 }, { label: "No Tomatoes 🍅", price: 0 }, { label: "No Coriander 🌿", price: 0 }] },
];

export default function CustomizationModal({ item, vendor_id, vendor_name, onClose, onAdd }: Props) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  const customizations = categoryCustomizations[item.category || ""] || defaultCustomizations;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const initial: Record<string, string[]> = {};
    customizations.forEach((cat) => {
      initial[cat.label] = cat.multi ? [] : [cat.options[0]?.label || ""];
    });
    setSelectedOptions(initial);
  }, [item.category]);

  const toggleOption = (catLabel: string, optionLabel: string, multi?: boolean) => {
    setSelectedOptions((prev) => {
      const current = prev[catLabel] || [];
      if (multi) {
        return { ...prev, [catLabel]: current.includes(optionLabel) ? current.filter((l) => l !== optionLabel) : [...current, optionLabel] };
      }
      return { ...prev, [catLabel]: [optionLabel] };
    });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const calculateAddonsPrice = () => {
    let extra = 0;
    customizations.forEach((cat) => {
      const selected = selectedOptions[cat.label] || [];
      selected.forEach((label) => {
        const opt = cat.options.find((o) => o.label === label);
        if (opt) extra += opt.price;
      });
    });
    return extra;
  };

  const handleAddToCart = () => {
    const extras = customizations
      .flatMap((cat) => (selectedOptions[cat.label] || []).filter(Boolean))
      .join(", ");
    const finalPrice = item.price + calculateAddonsPrice();

    if (onAdd) {
      onAdd({ ...item, price: finalPrice, quantity, vendor_id, vendor_name });
    } else {
      addItem({
        id: item.id + Date.now(),
        menu_item_id: item.id,
        vendor_id,
        vendor_name,
        name: extras ? `${item.name} (${extras})` : item.name,
        price: finalPrice,
        image_url: item.image_url,
      }, quantity);
    }
    onClose();
  };

  const addonsPrice = calculateAddonsPrice();
  const totalPrice = (item.price + addonsPrice) * quantity;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[var(--color-surface-container-lowest)] rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[85vh] animate-slide-up">
        {/* Header */}
        <div className="bg-white dark:bg-[var(--color-surface)] z-10 border-b border-[var(--color-border-subtle)] px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--color-on-surface)]">Customize</h2>
            <p className="text-sm text-[var(--color-outline)]">{item.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center">
            <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Item Preview */}
          <div className="flex gap-4 bg-[var(--color-surface-subtle)] rounded-2xl p-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--color-surface-container-high)] flex-shrink-0">
              {item.image_url ? (
                <BlurImage src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[var(--color-outline-variant)]">restaurant</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-[var(--color-on-surface)]">{item.name}</h3>
              {item.description && (
                <p className="text-xs text-[var(--color-outline)] mt-1 line-clamp-2">{item.description}</p>
              )}
              <p className="text-base font-extrabold text-[var(--color-primary)] mt-1">₹{item.price}</p>
            </div>
          </div>

          {/* Customization Options */}
          {customizations.map((cat) => {
            const selected = selectedOptions[cat.label] || [];
            return (
              <div key={cat.label}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[var(--color-on-surface)]">{cat.label}</h3>
                  {cat.multi && <span className="text-[10px] font-bold text-[var(--color-outline)]">Optional</span>}
                </div>
                <div className="space-y-2">
                  {cat.options.map((opt) => {
                    const isSelected = selected.includes(opt.label);
                    return (
                      <button
                        key={opt.label}
                        onClick={() => toggleOption(cat.label, opt.label, cat.multi)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-primary/10 border-2 border-primary text-primary"
                            : "bg-[var(--color-surface-subtle)] border-2 border-transparent text-[var(--color-on-surface)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {cat.multi ? (
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "border-primary bg-primary" : "border-[var(--color-outline)]"}`}>
                              {isSelected && <span className="material-symbols-outlined text-white text-xs">check</span>}
                            </div>
                          ) : (
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-primary" : "border-[var(--color-outline)]"}`}>
                              {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                            </div>
                          )}
                          <span>{opt.label}</span>
                        </div>
                        {opt.price > 0 && (
                          <span className="text-xs font-bold">+₹{opt.price}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quantity */}
          <div>
            <h3 className="font-bold text-[var(--color-on-surface)] mb-3">Quantity</h3>
            <div className="flex items-center gap-4 bg-[var(--color-surface-subtle)] rounded-2xl p-2 w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-[var(--color-surface-container-lowest)] shadow flex items-center justify-center hover:bg-[var(--color-surface-container)] transition-colors"
              >
                <span className="material-symbols-outlined text-[var(--color-primary)]">remove</span>
              </button>
              <span className="text-xl font-extrabold text-[var(--color-on-surface)] w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-[var(--color-surface-container-lowest)] shadow flex items-center justify-center hover:bg-[var(--color-surface-container)] transition-colors"
              >
                <span className="material-symbols-outlined text-[var(--color-primary)]">add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[var(--color-surface-container-lowest)] border-t border-[var(--color-border-subtle)] px-6 py-4 pb-[env(safe-area-inset-bottom)] flex-shrink-0">
          <button
            onClick={handleAddToCart}
            className="w-full py-4 bg-primary text-white font-extrabold rounded-2xl flex items-center justify-center gap-3 hover:bg-primary-dim active:scale-95 transition-all shadow-lg shadow-primary/30"
          >
            <span className="material-symbols-outlined">add_shopping_cart</span>
            <span>Add to Cart</span>
            <span className="bg-white/20 px-2 py-1 rounded-lg">₹{totalPrice.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}