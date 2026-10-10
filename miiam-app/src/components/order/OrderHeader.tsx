"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

interface OrderHeaderProps {
  orderId: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  extraActions?: React.ReactNode;
}

export default function OrderHeader({
  orderId,
  isRefreshing,
  onRefresh,
  extraActions,
}: OrderHeaderProps) {
  return (
    <>
      <nav className="fixed top-0 z-50 flex w-full items-center justify-between bg-[var(--color-surface-container-lowest)]/90 px-3 py-4 shadow-sm backdrop-blur-2xl sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/app/orders"
            className="bg-surface-container hover:bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-full transition-all"
            aria-label="Go to orders"
          >
            <span className="material-symbols-outlined text-accent">arrow_back</span>
          </Link>
          <span className="text-accent text-2xl font-extrabold tracking-tighter">MIIAM</span>
        </div>
        <div className="flex items-center gap-3">
          {extraActions}
          <button
            onClick={onRefresh}
            className="bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-[var(--color-surface-container-high)]"
            title="Refresh Order"
            aria-label="Refresh order"
          >
            <span
              className={`material-symbols-outlined text-on-surface ${isRefreshing ? "animate-spin" : ""}`}
            >
              refresh
            </span>
          </button>
          <Link
            href="/app/notifications"
            className="bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-[var(--color-surface-container-high)]"
          >
            <span className="material-symbols-outlined text-on-surface">notifications</span>
          </Link>
        </div>
      </nav>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "My Orders", href: "/app/orders" },
          { label: `Order #${orderId.slice(0, 8).toUpperCase()}` },
        ]}
      />
    </>
  );
}
