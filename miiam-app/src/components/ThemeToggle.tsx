"use client";

import { useThemeStore } from "@/lib/store/themeStore";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useThemeStore();

  const options: { value: "light" | "dark" | "system"; icon: string; label: string }[] = [
    { value: "light", icon: "light_mode", label: "Light" },
    { value: "dark", icon: "dark_mode", label: "Dark" },
    { value: "system", icon: "brightness_auto", label: "System" },
  ];

  return (
    <div className={`flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            theme === opt.value
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
          title={opt.label}
        >
          <span className="material-symbols-outlined text-sm">{opt.icon}</span>
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
