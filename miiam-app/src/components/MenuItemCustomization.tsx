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
  onChange,
}: MenuItemCustomizationProps) {
  const handleToggle = (optionId: string) => {
    if (customization.type === "single") {
      onChange([optionId]);
    } else {
      const isSelected = selected.includes(optionId);
      if (isSelected) {
        if (customization.minSelect && selected.length <= customization.minSelect) return;
        onChange(selected.filter((id) => id !== optionId));
      } else {
        if (customization.maxSelect && selected.length >= customization.maxSelect) return;
        onChange([...selected, optionId]);
      }
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-[var(--color-on-surface)]">{customization.name}</h4>
          <p className="text-xs text-[var(--color-outline)]">
            {customization.required ? "Required" : "Optional"}
            {customization.type === "multi" &&
              customization.maxSelect &&
              ` • Max ${customization.maxSelect}`}
          </p>
        </div>
        {customization.required && (
          <span className="rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-600">
            Required
          </span>
        )}
      </div>

      <div className="space-y-2">
        {customization.options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                isSelected
                  ? "border-[var(--color-primary)] bg-red-50"
                  : "border-[var(--color-border-subtle)] hover:border-[var(--color-outline-variant)]"
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
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                      : "border-[var(--color-outline-variant)]"
                  }`}
                >
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-[var(--color-surface-container-lowest)]" />
                  )}
                </div>
                <span
                  className={`font-medium ${isSelected ? "text-[var(--color-on-surface)]" : "text-[var(--color-on-surface-variant)]"}`}
                >
                  {option.name}
                </span>
              </div>
              {option.price > 0 && (
                <span className="text-sm font-bold text-[var(--color-accent)]">
                  +₹{option.price}
                </span>
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
    return (
      sum +
      cust.options.filter((opt) => selected.includes(opt.id)).reduce((s, opt) => s + opt.price, 0)
    );
  }, 0);

  if (total === 0) return null;

  const selectedNames = customizations.flatMap((cust) =>
    (selections[cust.id] || [])
      .map((id) => cust.options.find((opt) => opt.id === id)?.name)
      .filter(Boolean)
  );

  return (
    <div className="mt-2 text-xs text-[var(--color-outline)]">
      {selectedNames.join(" • ")}
      <span className="ml-1 font-bold text-[var(--color-accent)]">+₹{total}</span>
    </div>
  );
}
