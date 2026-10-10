"use client";

interface SkeletonProps {
  className?: string;
  variant?: "pulse" | "shimmer" | "wave";
}

export function Skeleton({ className = "", variant = "shimmer" }: SkeletonProps) {
  const variants = {
    pulse: "animate-pulse bg-gray-200 dark:bg-gray-700",
    shimmer:
      "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer",
    wave: "bg-gray-200 dark:bg-gray-700 relative overflow-hidden after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent dark:after:via-white/10",
  };

  return <div className={`${variants[variant]} rounded ${className}`} aria-hidden="true" />;
}

export function VendorCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)]">
      <Skeleton className="h-40 w-full" />
      <div className="space-y-3 p-4">
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
    <div className="flex gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4">
      <Skeleton className="h-20 w-20 flex-shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-3 h-5 w-16" />
      </div>
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Section header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Vendor cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)]"
          >
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
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
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4"
          >
            <Skeleton className="h-20 w-20 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 flex-shrink-0 rounded-sm" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-4 w-14" />
            </div>
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FoodPageSkeleton() {
  return (
    <div className="bg-surface min-h-screen space-y-6 p-4">
      <div className="bg-surface-container-high h-12 animate-pulse rounded-2xl" />
      <div className="bg-surface-container-high h-44 animate-pulse rounded-2xl" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-shrink-0 flex-col items-center gap-1.5">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-3 w-10 rounded" />
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
          <div key={i} className="w-36 flex-shrink-0 overflow-hidden rounded-2xl">
            <Skeleton className="h-24 w-full" />
            <div className="space-y-2 p-2.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-container-lowest flex overflow-hidden rounded-2xl">
            <Skeleton className="h-28 w-28 flex-shrink-0" />
            <div className="flex-1 space-y-2 p-3">
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
    <div className="min-h-screen space-y-6 bg-gray-50 p-4">
      <div className="h-10 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-44 animate-pulse rounded-2xl bg-gray-200" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-shrink-0 flex-col items-center gap-1.5">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white">
            <Skeleton className="h-44 w-full" />
            <div className="space-y-3 p-4">
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
    <div className="space-y-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
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
        <div
          key={i}
          className="flex gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4"
        >
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
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
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
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
      <Skeleton className="mb-2 h-4 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function RiderDashboardSkeleton() {
  return (
    <div className="min-h-screen space-y-4 bg-[var(--color-surface-container-lowest)] p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
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
    <div className="rounded-xl bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
      <Skeleton className="mb-4 h-40 w-full rounded-lg" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="bg-surface min-h-screen pb-24">
      {/* Sticky Header */}
      <div className="bg-surface-container-lowest px-5 pt-12 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-1.5 h-3 w-20" />
            <Skeleton className="mb-2 h-6 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        {/* Location bar */}
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Offers Carousel */}
      <div className="mt-3 px-5">
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>

      {/* Serviceability Chip */}
      <div className="mt-3 px-5">
        <Skeleton className="h-8 w-48 rounded-full" />
      </div>

      {/* Categories - Horizontal Scroll */}
      <div className="px-5 pt-4">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-shrink-0 flex-col items-center gap-2">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Reorder */}
      <div className="mt-5 px-5">
        <Skeleton className="mb-3 h-5 w-28" />
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 flex-shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Spotlight */}
      <div className="mt-5 px-5">
        <Skeleton className="mb-3 h-5 w-32" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>

      {/* Featured / Promoted */}
      <div className="mt-5 px-5">
        <Skeleton className="mb-3 h-5 w-36" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest w-40 flex-shrink-0 overflow-hidden rounded-2xl shadow-sm"
            >
              <Skeleton className="h-28 w-full" />
              <div className="space-y-1.5 p-2.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2.5 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-10 rounded-full" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Combos */}
      <div className="mt-5 px-5">
        <Skeleton className="mb-3 h-5 w-24" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest overflow-hidden rounded-2xl shadow-sm"
            >
              <Skeleton className="h-28 w-full" />
              <div className="space-y-1.5 p-2.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-16" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-5 w-14 rounded-full" />
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
    <div className="bg-surface min-h-screen pb-24">
      <div className="bg-surface/80 fixed top-0 z-50 w-full px-4 py-4 backdrop-blur-2xl">
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
      <div className="space-y-4 px-4 pt-20">
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-20 flex-shrink-0 rounded-full" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="space-y-3 rounded-2xl bg-[var(--color-surface-container-lowest)] p-4"
            >
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
