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
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container rounded-full"
        >
          <span className={`material-symbols-outlined text-sm ${chip.color || "text-on-surface-variant"}`}>
            {chip.icon}
          </span>
          <span className="text-xs font-bold text-on-surface-variant">{chip.label}</span>
        </div>
      ))}
    </div>
  );
}
