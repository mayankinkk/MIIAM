"use client";

import { useRef, useEffect, useState } from "react";

interface CategoryChipsProps {
  categories: Array<{ id: string; label: string; icon?: string }>;
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function CategoryChips({ categories, active, onChange, className = "" }: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const check = () => {
      setShowLeft(el.scrollLeft > 10);
      setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Left fade */}
      {showLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none" />
      )}

      {/* Right fade */}
      {showRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none" />
      )}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              active === cat.id
                ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {cat.icon && <span className="material-symbols-outlined text-sm">{cat.icon}</span>}
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
