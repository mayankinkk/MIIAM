"use client";

import { motion } from "framer-motion";

interface AddressCardProps {
  label: string;
  address: string;
  landmark?: string;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AddressCard({
  label,
  address,
  landmark,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: AddressCardProps) {
  return (
    <motion.div
      whileTap={onSelect ? { scale: 0.98 } : undefined}
      onClick={onSelect}
      className={`relative rounded-xl border-2 p-4 transition-all ${
        isSelected ? "border-primary bg-primary/5" : "border-outline/10 hover:border-outline/20"
      } ${onSelect ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isSelected
              ? "bg-primary text-on-primary"
              : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {label.toLowerCase().includes("home")
              ? "home"
              : label.toLowerCase().includes("work")
                ? "work"
                : "location_on"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-on-surface text-sm font-bold">{label}</p>
          <p className="text-on-surface-variant mt-0.5 text-xs leading-relaxed">{address}</p>
          {landmark && <p className="text-on-surface-variant/60 mt-0.5 text-xs">{landmark}</p>}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex shrink-0 gap-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="hover:bg-surface-container-high rounded-lg p-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-sm">
                  edit
                </span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="hover:bg-status-error/10 rounded-lg p-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-status-error text-sm">delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
