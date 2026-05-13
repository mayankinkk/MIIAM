"use client";

import { useState } from "react";

export interface MenuItemOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuItemCustomization {
  id: string;
  name: string;
  type: "single" | "multi";
  required: boolean;
  minSelect?: number;
  maxSelect?: number;
  options: MenuItemOption[];
}

interface MenuItemCustomizationProps {
  customization: MenuItemCustomization;
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MenuItemCustomizationCard({ 
  customization, 
  selected, 
  onChange 
}: MenuItemCustomizationProps) {
  const handleToggle = (optionId: string) => {
    if (customization.type === "single") {
      onChange([optionId]);
    } else {
      const isSelected = selected.includes(optionId);
      if (isSelected) {
        if (customization.minSelect && selected.length <= customization.minSelect) return;
        onChange(selected.filter(id => id !== optionId));
      } else {
        if (customization.maxSelect && selected.length >= customization.maxSelect) return;
        onChange([...selected, optionId]);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-bold text-slate-800">{customization.name}</h4>
          <p className="text-xs text-slate-500">
            {customization.required ? "Required" : "Optional"}
            {customization.type === "multi" && customization.maxSelect && ` • Max ${customization.maxSelect}`}
          </p>
        </div>
        {customization.required && (
          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Required</span>
        )}
      </div>
      
      <div className="space-y-2">
        {customization.options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected 
                  ? "border-[#ba001c] bg-red-50" 
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type={customization.type === "single" ? "radio" : "checkbox"}
                  name={customization.id}
                  checked={isSelected}
                  onChange={() => handleToggle(option.id)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? "border-[#ba001c] bg-[#ba001c]" : "border-slate-300"
                }`}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={`font-medium ${isSelected ? "text-slate-800" : "text-slate-600"}`}>
                  {option.name}
                </span>
              </div>
              {option.price > 0 && (
                <span className="text-sm font-bold text-[#ba001c]">+₹{option.price}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

interface CustomizationSummaryProps {
  customizations: MenuItemCustomization[];
  selections: Record<string, string[]>;
}

export function CustomizationSummary({ customizations, selections }: CustomizationSummaryProps) {
  const total = customizations.reduce((sum, cust) => {
    const selected = selections[cust.id] || [];
    return sum + cust.options
      .filter(opt => selected.includes(opt.id))
      .reduce((s, opt) => s + opt.price, 0);
  }, 0);

  if (total === 0) return null;

  const selectedNames = customizations.flatMap(cust => 
    (selections[cust.id] || []).map(id => 
      cust.options.find(opt => opt.id === id)?.name
    ).filter(Boolean)
  );

  return (
    <div className="text-xs text-slate-500 mt-2">
      {selectedNames.join(" • ")}
      <span className="font-bold text-[#ba001c] ml-1">+₹{total}</span>
    </div>
  );
}