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

export default function AddressCard({ label, address, landmark, isSelected, onSelect, onEdit, onDelete }: AddressCardProps) {
  return (
    <motion.div
      whileTap={onSelect ? { scale: 0.98 } : undefined}
      onClick={onSelect}
      className={`relative p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-outline/10 hover:border-outline/20"
      } ${onSelect ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isSelected ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
        }`}>
          <span className="material-symbols-outlined text-lg">
            {label.toLowerCase().includes("home") ? "home" : label.toLowerCase().includes("work") ? "work" : "location_on"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-on-surface">{label}</p>
          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{address}</p>
          {landmark && <p className="text-xs text-on-surface-variant/60 mt-0.5">{landmark}</p>}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">edit</span>
              </button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg hover:bg-status-error/10 transition-colors">
                <span className="material-symbols-outlined text-sm text-status-error">delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
