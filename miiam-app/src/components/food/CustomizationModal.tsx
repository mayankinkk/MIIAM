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
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [customizations, setCustomizations] = useState<Record<string, CustomizationOption[]>>({
    "Spice Level": commonCustomizations["Spice Level"].options.map((o) => ({ ...o, selected: o.label.includes("Medium") })),
    "Add Ons": [],
  });
  const [showAllCustomizations, setShowAllCustomizations] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleCustomizationToggle = (group: string, optionLabel: string) => {
    const isRadio = ["Spice Level", "Size", "Bread Type", "Rice Type"].includes(group);
    
    setCustomizations((prev) => ({
      ...prev,
      [group]: prev[group].map((opt) =>
        isRadio
          ? { ...opt, selected: opt.label === optionLabel }
          : { ...opt, selected: opt.label === optionLabel ? !opt.selected : opt.selected }
      ),
    }));
  };

  const calculateExtraPrice = () => {
    let extra = 0;
    Object.values(customizations).forEach((options) => {
      options.forEach((opt) => {
        if (opt.selected) extra += opt.price;
      });
    });
    return extra;
  };

  const handleAddToCart = () => {
    const extraPrice = calculateExtraPrice();
    const selectedCustomizations: string[] = [];
    Object.entries(customizations).forEach(([group, options]) => {
      options.forEach((opt) => {
        if (opt.selected) selectedCustomizations.push(opt.label);
      });
    });

    const customizationsNote = selectedCustomizations.length > 0 ? selectedCustomizations.join(", ") : "";
    const fullNotes = [customizationsNote, specialInstructions].filter(Boolean).join(". ");

    if (onAdd) {
      onAdd({
        ...item,
        quantity,
        vendor_id,
        vendor_name,
        special_notes: fullNotes,
        price: item.price + extraPrice,
      });
    } else {
      addItem({
        id: item.id + Date.now(),
        menu_item_id: item.id,
        vendor_id,
        vendor_name,
        name: item.name,
        price: item.price + extraPrice,
        image_url: item.image_url,
        special_notes: fullNotes,
      }, quantity);
    }

    onClose();
  };

  const extraPrice = calculateExtraPrice();
  const totalPrice = (item.price + extraPrice) * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Customize Your Order</h2>
            <p className="text-sm text-slate-500">{item.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-600">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Item Preview */}
          <div className="flex gap-4 bg-slate-50 rounded-2xl p-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
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
              <p className="text-lg font-extrabold text-[#ba001c] mt-2">₹{item.price}</p>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3">Quantity</h3>
            <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-2 w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center hover:bg-[#ffe1e4] transition-colors"
              >
                <span className="material-symbols-outlined text-[#ba001c]">remove</span>
              </button>
              <span className="text-xl font-extrabold text-slate-900 w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center hover:bg-[#ffe1e4] transition-colors"
              >
                <span className="material-symbols-outlined text-[#ba001c]">add</span>
              </button>
            </div>
          </div>

          {/* Required Customizations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800">Spice Level <span className="text-[#ba001c]">*</span></h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {customizations["Spice Level"]?.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleCustomizationToggle("Spice Level", opt.label)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all text-left ${
                    opt.selected
                      ? "border-[#ba001c] bg-[#fff4f4] text-[#ba001c]"
                      : "border-slate-200 text-slate-600 hover:border-[#ba001c]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Show More Customizations */}
          {!showAllCustomizations ? (
            <button
              onClick={() => setShowAllCustomizations(true)}
              className="w-full py-3 text-center text-[#ba001c] font-bold text-sm border border-dashed border-[#ba001c] rounded-xl hover:bg-[#fff4f4] transition-colors"
            >
              + Add More Customizations
            </button>
          ) : (
            <>
              {/* Add Ons */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800">Add Ons</h3>
                  <span className="text-xs text-slate-500">Extra charges may apply</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {customizations["Add Ons"]?.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleCustomizationToggle("Add Ons", opt.label)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all text-left flex items-center justify-between ${
                        opt.selected
                          ? "border-[#ba001c] bg-[#fff4f4] text-[#ba001c]"
                          : "border-slate-200 text-slate-600 hover:border-[#ba001c]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.price > 0 && <span className="text-xs font-bold">+₹{opt.price}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remove Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800">Remove Ingredients</h3>
                  <span className="text-xs text-slate-500">Free</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {commonCustomizations["Remove Ingredients"].options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleCustomizationToggle("Remove Ingredients", opt.label)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all text-left ${
                        customizations["Remove Ingredients"]?.find((o) => o.label === opt.label)?.selected
                          ? "border-[#ba001c] bg-[#fff4f4] text-[#ba001c]"
                          : "border-slate-200 text-slate-600 hover:border-[#ba001c]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bread Type */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800">Bread Type</h3>
                  <span className="text-xs text-slate-500">Extra charges may apply</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {commonCustomizations["Bread Type"].options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleCustomizationToggle("Bread Type", opt.label)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all text-left flex items-center justify-between ${
                        customizations["Bread Type"]?.find((o) => o.label === opt.label)?.selected
                          ? "border-[#ba001c] bg-[#fff4f4] text-[#ba001c]"
                          : "border-slate-200 text-slate-600 hover:border-[#ba001c]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.price > 0 && <span className="text-xs font-bold">+₹{opt.price}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Special Instructions */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3">Special Instructions</h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="E.g., Please make it extra spicy, no salt, etc."
              className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20 resize-none"
            />
            <p className="text-xs text-slate-400 mt-2 text-right">{specialInstructions.length}/150 characters</p>
          </div>

          {/* Quick Notes */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3">Quick Notes</h3>
            <div className="flex flex-wrap gap-2">
              {["No onions", "No garlic", "Less oil", "Extra spicy", "No salt", "Less spice"].map((note) => (
                <button
                  key={note}
                  onClick={() => setSpecialInstructions((prev) => prev ? `${prev}, ${note}` : note)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full hover:bg-[#ffe1e4] hover:text-[#ba001c] transition-colors"
                >
                  {note}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <button
            onClick={handleAddToCart}
            className="w-full py-4 bg-[#ba001c] text-white font-extrabold rounded-2xl flex items-center justify-center gap-3 hover:bg-[#a40017] active:scale-95 transition-all shadow-xl shadow-[#ba001c]/30"
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