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
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`sr-only focus:not-sr-only focus:absolute focus:top-16 focus:left-4 focus:z-50 focus:bg-surface focus:p-3 focus:rounded-xl focus:shadow-lg ${className}`}>
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span className="material-symbols-outlined text-xs text-on-surface-variant" aria-hidden="true">
                  chevron_right
                </span>
              )}
              {isLast || !item.href ? (
                <span aria-current="page" className="text-on-surface font-medium">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="text-primary hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
