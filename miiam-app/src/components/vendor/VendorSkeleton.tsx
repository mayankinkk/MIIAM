"use client";

export function VendorDashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-pulse">
      <div className="h-8 bg-[var(--color-surface-container)] rounded w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--color-surface-container)] rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-[var(--color-surface-container)] rounded-2xl" />
    </div>
  );
}

export function VendorTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 bg-[var(--color-surface-container)] rounded-xl" />
      ))}
    </div>
  );
}
