"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon: string;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  type?: "cart" | "orders" | "favorites" | "search" | "default";
}

export function EmptyState({ 
  icon, 
  emoji,
  title, 
  description, 
  actionLabel, 
  actionHref,
  type = "default" 
}: EmptyStateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const typeStyles: Record<string, { bg: string; icon: string; animation: string }> = {
    cart: { 
      bg: "bg-[#ffe1e4]", 
      icon: "text-[#ba001c]",
      animation: mounted ? "animate-bounce-subtle" : ""
    },
    orders: { 
      bg: "bg-[#c4d0ff]/20", 
      icon: "text-[#0b50d5]",
      animation: mounted ? "animate-pulse-slow" : ""
    },
    favorites: { 
      bg: "bg-rose-50", 
      icon: "text-rose-500",
      animation: mounted ? "animate-heartbeat" : ""
    },
    search: { 
      bg: "bg-amber-50", 
      icon: "text-amber-500",
      animation: mounted ? "animate-wiggle" : ""
    },
    default: { 
      bg: "bg-slate-50", 
      icon: "text-slate-500",
      animation: ""
    },
  };

  const style = typeStyles[type] || typeStyles.default;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Animated Icon Container */}
      <div className={`w-28 h-28 ${style.bg} rounded-full flex items-center justify-center mb-6 ${style.animation} relative`}>
        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-200/50 rounded-full animate-float" />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#ba001c]/20 rounded-full animate-float-delayed" />
        <div className="absolute top-1/2 -left-4 w-3 h-3 bg-blue-200/50 rounded-full animate-float" />
        
        {/* Main icon/emoji */}
        {emoji ? (
          <span className={`text-5xl ${mounted ? "animate-bounce-in" : ""}`}>{emoji}</span>
        ) : (
          <span className={`material-symbols-outlined text-5xl ${style.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        )}
      </div>
      
      {/* Title with typewriter effect */}
      <h3 className={`text-xl font-bold text-[#4d212a] mb-2 ${mounted ? "animate-fade-up" : ""}`}>
        {title}
      </h3>
      
      {/* Description */}
      <p className={`text-[#814c55] text-sm mb-6 max-w-xs ${mounted ? "animate-fade-up-delay" : ""}`}>
        {description}
      </p>
      
      {/* Action Button with shimmer */}
      {actionLabel && actionHref && (
        <Link 
          href={actionHref} 
          className={`group relative px-6 py-3 bg-[#ba001c] text-white font-bold rounded-xl overflow-hidden transition-all duration-300 hover:bg-[#a40017] hover:scale-105 active:scale-95 ${mounted ? "animate-fade-up-delay-2" : ""}`}
        >
          {/* Shimmer effect on hover */}
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="relative flex items-center gap-2">
            {actionLabel}
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </span>
        </Link>
      )}
    </div>
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
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <span className="text-5xl">📡</span>
      </div>
      <h3 className="text-xl font-bold text-[#4d212a] mb-2">Connection Lost</h3>
      <p className="text-[#814c55] text-sm mb-6 max-w-xs">
        Please check your internet connection and try again.
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-6 py-3 bg-[#ba001c] text-white font-bold rounded-xl hover:bg-[#a40017] transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">refresh</span>
          Retry
        </button>
      )}
    </div>
  );
}