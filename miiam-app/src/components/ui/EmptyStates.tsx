"use client";

import Link from "next/link";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-24 h-24 bg-[#ffe1e4] rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-5xl text-[#ba001c]">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-[#4d212a] mb-2">{title}</h3>
      <p className="text-[#814c55] text-sm mb-6 max-w-xs">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="px-6 py-3 bg-[#ba001c] text-white font-bold rounded-xl hover:bg-[#a40017] transition-colors">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function EmptyCart() {
  return (
    <EmptyState
      icon="shopping_cart"
      title="Your cart is empty"
      description="Looks like you haven't added anything yet. Start exploring to add items!"
      actionLabel="Explore Now"
      actionHref="/app/explore"
    />
  );
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon="receipt_long"
      title="No orders yet"
      description="You haven't placed any orders yet. Once you do, they'll appear here."
      actionLabel="Start Ordering"
      actionHref="/app/food"
    />
  );
}

export function EmptyFavorites() {
  return (
    <EmptyState
      icon="favorite"
      title="No favorites yet"
      description="Save your favorite restaurants and they'll appear here for quick access."
      actionLabel="Explore Restaurants"
      actionHref="/app/food"
    />
  );
}

export function EmptyAddresses() {
  return (
    <EmptyState
      icon="location_on"
      title="No saved addresses"
      description="Add your delivery addresses to quickly checkout on future orders."
      actionLabel="Add Address"
      actionHref="/app/addresses/add"
    />
  );
}