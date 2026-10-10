"use client";

import { useRef, useEffect, useState } from "react";

interface CategoryChipsProps {
  categories: Array<{ id: string; label: string; icon?: string }>;
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function CategoryChips({
  categories,
  active,
  onChange,
  className = "",
}: CategoryChipsProps) {
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
        <div className="from-surface pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-8 bg-gradient-to-r to-transparent" />
      )}

      {/* Right fade */}
      {showRight && (
        <div className="from-surface pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8 bg-gradient-to-l to-transparent" />
      )}

      <div ref={scrollRef} className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth py-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
              active === cat.id
                ? "bg-primary text-on-primary shadow-primary/20 shadow-md"
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
