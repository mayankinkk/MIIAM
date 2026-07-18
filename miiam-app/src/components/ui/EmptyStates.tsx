"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: string;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  type?: "cart" | "orders" | "favorites" | "search" | "default";
}

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  type = "default"
}: EmptyStateProps) {
  const typeStyles: Record<string, { bg: string; icon: string }> = {
    cart: { bg: "bg-primary/10", icon: "text-primary" },
    orders: { bg: "bg-secondary/10", icon: "text-secondary" },
    favorites: { bg: "bg-rose-500/10", icon: "text-rose-500" },
    search: { bg: "bg-amber-500/10", icon: "text-amber-500" },
    default: { bg: "bg-surface-container-high", icon: "text-on-surface-variant" },
  };

  const style = typeStyles[type] || typeStyles.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
        className={`w-24 h-24 ${style.bg} rounded-full flex items-center justify-center mb-6 relative`}
      >
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-200/50 rounded-full" />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary/20 rounded-full" />

        {emoji ? (
          <span className="text-5xl">{emoji}</span>
        ) : (
          <span className={`material-symbols-outlined text-5xl ${style.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        )}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-on-surface mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-on-surface-variant text-sm mb-6 max-w-xs"
      >
        {description}
      </motion.p>

      {actionLabel && actionHref && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href={actionHref}
            className="group relative px-6 py-3 bg-primary text-on-primary font-bold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="relative flex items-center gap-2">
              {actionLabel}
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
          </Link>
        </motion.div>
      )}
      {actionLabel && onAction && !actionHref && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={onAction}
            className="group relative px-6 py-3 bg-primary text-on-primary font-bold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="relative flex items-center gap-2">
              {actionLabel}
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

export function EmptyCart() {
  return (
    <EmptyState
      icon="shopping_cart"
      emoji="🛒"
      title="Your cart is empty"
      description="Looks like you haven't added anything yet. Start exploring to find delicious food!"
      actionLabel="Explore Food"
      actionHref="/app/food"
      type="cart"
    />
  );
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon="receipt_long"
      emoji="📋"
      title="No orders yet"
      description="You haven't placed any orders yet. Once you do, they'll appear here with all the details."
      actionLabel="Order Food"
      actionHref="/app/food"
      type="orders"
    />
  );
}

export function EmptyFavorites() {
  return (
    <EmptyState
      icon="favorite"
      emoji="❤️"
      title="No favorites yet"
      description="Save your favorite restaurants and they'll appear here for quick access. Start exploring!"
      actionLabel="Discover Restaurants"
      actionHref="/app/food"
      type="favorites"
    />
  );
}

export function EmptyAddresses() {
  return (
    <EmptyState
      icon="location_on"
      emoji="📍"
      title="No saved addresses"
      description="Add your delivery addresses to quickly checkout on future orders."
      actionLabel="Add Address"
      actionHref="/app/addresses/add"
      type="default"
    />
  );
}

export function EmptySearch({ query }: { query?: string }) {
  return (
    <EmptyState
      icon="search"
      emoji="🔍"
      title="No results found"
      description={query ? `We couldn't find anything for "${query}". Try different keywords.` : "Start typing to search for restaurants and dishes."}
      actionLabel="Clear Search"
      actionHref="/app/search"
      type="search"
    />
  );
}

export function EmptyBookings() {
  return (
    <EmptyState
      icon="calendar_month"
      emoji="📅"
      title="No bookings yet"
      description="You don't have any service bookings. Book a professional service now!"
      actionLabel="Book a Service"
      actionHref="/app/services"
      type="default"
    />
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <span className="text-5xl">📡</span>
      </div>
      <h3 className="text-xl font-bold text-on-surface mb-2">Connection Lost</h3>
      <p className="text-on-surface-variant text-sm mb-6 max-w-xs">
        Please check your internet connection and try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">refresh</span>
          Retry
        </button>
      )}
    </motion.div>
  );
}
