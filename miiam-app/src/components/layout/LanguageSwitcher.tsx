"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguageStore, Language } from "@/lib/store/languageStore";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "English (Default)" },
    { code: "hi", label: "Hindi" },
    { code: "as", label: "Assamese" },
    { code: "bn", label: "Bengali" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[44px] items-center gap-1 rounded-lg px-4 py-2.5 font-bold text-[var(--color-on-surface)] transition-colors hover:bg-[var(--color-surface-container)] hover:text-[var(--color-accent)]"
      >
        <span className="material-symbols-outlined text-[20px]">language</span>
        <span className="text-sm uppercase">{language}</span>
        <span className="material-symbols-outlined text-[18px]">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen && (
        <div className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-48 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] py-2 shadow-lg duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm font-semibold transition-colors ${
                language === lang.code
                  ? "bg-[var(--color-surface-container)] text-[var(--color-accent)]"
                  : "text-[var(--color-on-surface)] hover:bg-[var(--color-surface-subtle)]"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
