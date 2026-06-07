"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const { t } = useTranslation();
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`px-4 py-2 max-w-2xl mx-auto ${className}`}>
      <ol className="flex items-center gap-1 text-xs text-on-surface-variant">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span className="material-symbols-outlined text-[14px] text-outline" aria-hidden="true">
                chevron_right
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="hover:text-primary transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-on-surface" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
