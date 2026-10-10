"use client";

import { motion } from "framer-motion";

interface AnimatedTabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
  className?: string;
}

export default function AnimatedTabs({
  tabs,
  active,
  onChange,
  className = "",
}: AnimatedTabsProps) {
  return (
    <div className={`bg-surface-container relative flex gap-1 rounded-xl p-1 ${className}`}>
      {/* Sliding indicator */}
      <motion.div
        layoutId="tab-indicator"
        className="bg-primary absolute top-1 bottom-1 rounded-lg shadow-sm"
        style={{
          left: `${tabs.indexOf(active) * (100 / tabs.length)}%`,
          width: `${100 / tabs.length}%`,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />

      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`relative z-10 flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${
            active === tab ? "text-on-primary" : "text-on-surface-variant"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
