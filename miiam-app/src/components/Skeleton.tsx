"use client";

interface SkeletonProps {
  className?: string;
  variant?: "pulse" | "shimmer" | "wave";
}

export function Skeleton({ className = "", variant = "shimmer" }: SkeletonProps) {
  const variants = {
    pulse: "animate-pulse bg-gray-200 dark:bg-gray-700",
    shimmer: "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer",
    wave: "bg-gray-200 dark:bg-gray-700 relative overflow-hidden after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent dark:after:via-white/10",
  };

  return (
    <div
      className={`${variants[variant]} rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function VendorCardSkeleton() {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden border border-[var(--color-border-subtle)]">
      <Skeleton className="h-40 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)]">
      <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-16 mt-3" />
      </div>
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      
      {/* Vendor cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden border border-[var(--color-border-subtle)]">
            <Skeleton className="h-32 w-full" />
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Menu items section */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 p-4 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)]">
            <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FoodPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface p-4 space-y-6">
      <div className="h-12 bg-surface-container-high rounded-2xl animate-pulse" />
      <div className="h-44 bg-surface-container-high rounded-2xl animate-pulse" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="w-10 h-3 rounded" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-36 rounded-2xl overflow-hidden">
            <Skeleton className="h-24 w-full" />
            <div className="p-2.5 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex bg-surface-container-lowest rounded-2xl overflow-hidden">
            <Skeleton className="w-28 h-28 flex-shrink-0" />
            <div className="p-3 flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ServicesPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-44 bg-gray-200 rounded-2xl animate-pulse" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="w-12 h-3 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden">
            <Skeleton className="h-44 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="p-6 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)]">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-6 border border-[var(--color-border-subtle)]">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)]">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function RiderDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      {/* Map area */}
      <Skeleton className="h-64 w-full rounded-2xl" />
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      {/* Order card */}
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-sm">
      <Skeleton className="h-40 w-full rounded-lg mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] pb-24">
      {/* Header skeleton */}
      <div className="bg-[var(--color-surface-container-lowest)] shadow-sm px-4 pt-4 pb-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-7 w-36 mb-3" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="mt-3">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Offers carousel skeleton */}
      <div className="px-4 py-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>

      {/* Categories skeleton */}
      <div className="px-4 pb-4">
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[var(--color-surface-container)] rounded-2xl p-4 text-center">
              <Skeleton className="h-12 w-12 rounded-xl mx-auto mb-2" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Spotlight skeleton */}
      <div className="px-4 pb-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>

      {/* Featured skeleton */}
      <div className="px-4 pb-4">
        <Skeleton className="h-5 w-36 mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-36 bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden border border-[var(--color-border-subtle)]">
              <Skeleton className="h-28 w-full" />
              <div className="p-2 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby restaurants skeleton */}
      <div className="px-4 pb-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3 bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] p-3">
              <Skeleton className="h-20 w-20 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FoodSkeleton() {
  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl px-4 py-4">
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
      <div className="pt-20 px-4 space-y-4">
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-20 rounded-full flex-shrink-0" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 space-y-3">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}