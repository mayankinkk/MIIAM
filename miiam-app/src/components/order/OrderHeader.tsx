"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

interface OrderHeaderProps {
  orderId: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function OrderHeader({ orderId, isRefreshing, onRefresh }: OrderHeaderProps) {
  return (
    <>
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-3 sm:px-6 py-4 bg-[var(--color-surface-container-lowest)]/90 backdrop-blur-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/app/orders" className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <span className="text-2xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onRefresh} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-slate-200 transition-all" title="Refresh Order">
            <span className={`material-symbols-outlined text-on-surface ${isRefreshing ? "animate-spin" : ""}`}>refresh</span>
          </button>
          <Link href="/app/notifications" className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-slate-200 transition-all">
            <span className="material-symbols-outlined text-on-surface">notifications</span>
          </Link>
          <span className="material-symbols-outlined text-on-surface cursor-pointer hover:opacity-80 transition-opacity">account_circle</span>
        </div>
      </nav>
      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'My Orders', href: '/app/orders' }, { label: `Order #${orderId.slice(0, 8).toUpperCase()}` }]} />
    </>
  );
}
