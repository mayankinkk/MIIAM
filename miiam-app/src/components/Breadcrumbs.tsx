"use client";

import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav className={`px-6 py-2.5 text-xs text-slate-500 font-medium flex items-center gap-2 bg-white border-b border-slate-100 ${className}`}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-slate-300">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-[#ba001c] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#ba001c] font-bold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
