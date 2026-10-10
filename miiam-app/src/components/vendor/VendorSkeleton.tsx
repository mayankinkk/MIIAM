"use client";

export function VendorDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-4 md:p-8">
      <div className="h-8 w-48 rounded bg-[var(--color-surface-container)]" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[var(--color-surface-container)]" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-[var(--color-surface-container)]" />
    </div>
  );
}

export function VendorTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-[var(--color-surface-container)]" />
      ))}
    </div>
  );
}
