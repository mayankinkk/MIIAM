"use client";

import { useThemeStore } from "@/lib/store/themeStore";
import { motion } from "framer-motion";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useThemeStore();

  const options: { value: "light" | "dark" | "system"; icon: string; label: string }[] = [
    { value: "light", icon: "light_mode", label: "Light" },
    { value: "dark", icon: "dark_mode", label: "Dark" },
    { value: "system", icon: "brightness_auto", label: "System" },
  ];

  return (
    <div className={`relative flex gap-1 bg-surface-container rounded-xl p-1 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`relative z-10 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
            theme === opt.value ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface"
          }`}
          title={opt.label}
        >
          {theme === opt.value && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-surface-container-lowest rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          )}
          <span className="material-symbols-outlined text-sm relative z-10">{opt.icon}</span>
          <span className="hidden sm:inline relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
