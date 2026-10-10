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
    {
      label: "Spice Level",
      options: [
        { label: "Mild 🌶️", price: 0 },
        { label: "Medium 🌶️🌶️", price: 0 },
        { label: "Spicy 🌶️🌶️🌶️", price: 0 },
        { label: "Extra Spicy 🌶️🌶️🌶️🌶️", price: 10 },
      ],
    },
    {
      label: "Add Ons",
      multi: true,
      options: [
        { label: "Extra Cheese 🧀", price: 50 },
        { label: "Extra Sauce 🫙", price: 20 },
        { label: "Extra Veggies 🥬", price: 30 },
      ],
    },
  ],
  "Main Course": [
    {
      label: "Spice Level",
      options: [
        { label: "Mild 🌶️", price: 0 },
        { label: "Medium 🌶️🌶️", price: 0 },
        { label: "Spicy 🌶️🌶️🌶️", price: 0 },
      ],
    },
    {
      label: "Bread Type",
      options: [
        { label: "Regular Roti 🫓", price: 0 },
        { label: "Butter Naan 🧈", price: 20 },
        { label: "Garlic Naan 🧄", price: 25 },
        { label: "Tandoori Roti 🔥", price: 15 },
      ],
    },
    {
      label: "Rice Type",
      options: [
        { label: "Steamed Rice 🍚", price: 0 },
        { label: "Jeera Rice 🍚", price: 20 },
        { label: "Biryani Rice 🍚", price: 30 },
      ],
    },
  ],
  Desserts: [
    {
      label: "Size",
      options: [
        { label: "Regular", price: 0 },
        { label: "Large (+50%)", price: 30 },
      ],
    },
  ],
  Beverages: [
    {
      label: "Size",
      options: [
        { label: "Small", price: 0 },
        { label: "Medium", price: 15 },
        { label: "Large", price: 30 },
      ],
    },
    {
      label: "Sugar Level",
      options: [
        { label: "No Sugar", price: 0 },
        { label: "Low Sugar", price: 0 },
        { label: "Regular", price: 0 },
      ],
    },
  ],
  Bakery: [
    {
      label: "Size",
      options: [
        { label: "Regular", price: 0 },
        { label: "Large", price: 25 },
      ],
    },
  ],
};

const defaultCustomizations: CustomizationCategory[] = [
  {
    label: "Spice Level",
    options: [
      { label: "Mild 🌶️", price: 0 },
      { label: "Medium 🌶️🌶️", price: 0 },
      { label: "Spicy 🌶️🌶️🌶️", price: 0 },
    ],
  },
  {
    label: "Add Ons",
    multi: true,
    options: [
      { label: "Extra Cheese 🧀", price: 50 },
      { label: "Extra Sauce 🫙", price: 20 },
      { label: "Extra Veggies 🥬", price: 30 },
      { label: "Extra Protein 🍗", price: 60 },
    ],
  },
  {
    label: "Remove Ingredients",
    multi: true,
    options: [
      { label: "No Onions 🧅", price: 0 },
      { label: "No Tomatoes 🍅", price: 0 },
      { label: "No Coriander 🌿", price: 0 },
    ],
  },
];

export default function CustomizationModal({
  item,
  vendor_id,
  vendor_name,
  onClose,
  onAdd,
}: Props) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  const customizations = categoryCustomizations[item.category || ""] || defaultCustomizations;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
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
        return {
          ...prev,
          [catLabel]: current.includes(optionLabel)
            ? current.filter((l) => l !== optionLabel)
            : [...current, optionLabel],
        };
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
      addItem(
        {
          id: item.id + Date.now(),
          menu_item_id: item.id,
          vendor_id,
          vendor_name,
          name: extras ? `${item.name} (${extras})` : item.name,
          price: finalPrice,
          image_url: item.image_url,
        },
        quantity
      );
    }
    onClose();
  };

  const addonsPrice = calculateAddonsPrice();
  const totalPrice = (item.price + addonsPrice) * quantity;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-slide-up relative flex max-h-[85vh] w-full max-w-sm flex-col rounded-t-3xl bg-[var(--color-surface-container-lowest)] sm:rounded-3xl">
        {/* Header */}
        <div className="z-10 flex flex-shrink-0 items-center justify-between rounded-t-3xl border-b border-[var(--color-border-subtle)] bg-white px-6 py-4 sm:rounded-t-3xl dark:bg-[var(--color-surface)]">
          <div>
            <h2 className="text-lg font-extrabold text-[var(--color-on-surface)]">Customize</h2>
            <p className="text-sm text-[var(--color-outline)]">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-container)]"
          >
            <span className="material-symbols-outlined text-[18px] text-[var(--color-on-surface-variant)]">
              close
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Item Preview */}
          <div className="flex gap-4 rounded-2xl bg-[var(--color-surface-subtle)] p-4">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--color-surface-container-high)]">
              {item.image_url ? (
                <BlurImage
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                    restaurant
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-[var(--color-on-surface)]">{item.name}</h3>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-xs text-[var(--color-outline)]">
                  {item.description}
                </p>
              )}
              <p className="mt-1 text-base font-extrabold text-[var(--color-accent)]">
                ₹{item.price}
              </p>
            </div>
          </div>

          {/* Customization Options */}
          {customizations.map((cat) => {
            const selected = selectedOptions[cat.label] || [];
            return (
              <div key={cat.label}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-[var(--color-on-surface)]">{cat.label}</h3>
                  {cat.multi && (
                    <span className="text-[10px] font-bold text-[var(--color-outline)]">
                      Optional
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {cat.options.map((opt) => {
                    const isSelected = selected.includes(opt.label);
                    return (
                      <button
                        key={opt.label}
                        onClick={() => toggleOption(cat.label, opt.label, cat.multi)}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-primary/10 border-primary text-accent border-2"
                            : "border-2 border-transparent bg-[var(--color-surface-subtle)] text-[var(--color-on-surface)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {cat.multi ? (
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${isSelected ? "border-primary bg-primary" : "border-[var(--color-outline)]"}`}
                            >
                              {isSelected && (
                                <span className="material-symbols-outlined text-on-primary text-xs">
                                  check
                                </span>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? "border-primary" : "border-[var(--color-outline)]"}`}
                            >
                              {isSelected && (
                                <div className="bg-primary h-2.5 w-2.5 rounded-full" />
                              )}
                            </div>
                          )}
                          <span>{opt.label}</span>
                        </div>
                        {opt.price > 0 && <span className="text-xs font-bold">+₹{opt.price}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quantity */}
          <div>
            <h3 className="mb-3 font-bold text-[var(--color-on-surface)]">Quantity</h3>
            <div className="flex w-fit items-center gap-4 rounded-2xl bg-[var(--color-surface-subtle)] p-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-container-lowest)] shadow transition-colors hover:bg-[var(--color-surface-container)]"
              >
                <span className="material-symbols-outlined text-[var(--color-accent)]">remove</span>
              </button>
              <span className="w-8 text-center text-xl font-extrabold text-[var(--color-on-surface)]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-container-lowest)] shadow transition-colors hover:bg-[var(--color-surface-container)]"
              >
                <span className="material-symbols-outlined text-[var(--color-accent)]">add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-6 py-4 pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={handleAddToCart}
            className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary shadow-primary/30 flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-extrabold shadow-lg transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">add_shopping_cart</span>
            <span>Add to Cart</span>
            <span className="rounded-lg bg-white/20 px-2 py-1">₹{totalPrice.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
