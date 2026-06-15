"use client";

import { useState, useRef, useEffect } from 'react';
import { useLanguageStore, Language } from '@/lib/store/languageStore';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English (Default)' },
    { code: 'hi', label: 'Hindi' },
    { code: 'as', label: 'Assamese' },
    { code: 'bn', label: 'Bengali' },
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
        className="flex items-center gap-1 text-[var(--color-on-surface)] font-bold hover:text-[var(--color-primary)] transition-colors py-2.5 px-4 rounded-lg hover:bg-[var(--color-surface-container)] min-h-[44px]"
      >
        <span className="material-symbols-outlined text-[20px]">language</span>
        <span className="uppercase text-sm">{language}</span>
        <span className="material-symbols-outlined text-[18px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface-container-lowest)] rounded-xl shadow-lg border border-[var(--color-border-subtle)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors ${
                language === lang.code
                  ? 'bg-[var(--color-surface-container)] text-[var(--color-primary)]'
                  : 'text-[var(--color-on-surface)] hover:bg-[var(--color-surface-subtle)]'
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
