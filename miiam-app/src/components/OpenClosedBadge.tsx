"use client";

interface OpenClosedBadgeProps {
  isOpen: boolean;
  className?: string;
}

export default function OpenClosedBadge({ isOpen, className = "" }: OpenClosedBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
      isOpen
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
    } ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
      {isOpen ? "Open" : "Closed"}
    </span>
  );
}
