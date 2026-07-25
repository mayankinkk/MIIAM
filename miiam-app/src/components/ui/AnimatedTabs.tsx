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

export default function AnimatedTabs({ tabs, activeTab, onTabChange, className = "" }: AnimatedTabsProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative px-4 py-2.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${
            activeTab === tab.id ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-primary/10 rounded-full"
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