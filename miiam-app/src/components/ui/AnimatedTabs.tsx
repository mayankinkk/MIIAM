"use client";

import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export default function AnimatedTabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: AnimatedTabsProps) {
  return (
    <div className={`scrollbar-hide flex gap-2 overflow-x-auto pb-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative rounded-full px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors ${
            activeTab === tab.id ? "text-accent" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="bg-primary/10 absolute inset-0 rounded-full"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon && <span className="material-symbols-outlined text-sm">{tab.icon}</span>}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
