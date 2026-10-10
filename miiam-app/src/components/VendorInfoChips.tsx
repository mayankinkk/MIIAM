"use client";

interface InfoChip {
  icon: string;
  label: string;
  color?: string;
}

interface VendorInfoChipsProps {
  chips: InfoChip[];
  className?: string;
}

export default function VendorInfoChips({ chips, className = "" }: VendorInfoChipsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {chips.map((chip, i) => (
        <div
          key={i}
          className="bg-surface-container flex items-center gap-1.5 rounded-full px-2.5 py-1.5"
        >
          <span
            className={`material-symbols-outlined text-sm ${chip.color || "text-on-surface-variant"}`}
          >
            {chip.icon}
          </span>
          <span className="text-on-surface-variant text-xs font-bold">{chip.label}</span>
        </div>
      ))}
    </div>
  );
}
