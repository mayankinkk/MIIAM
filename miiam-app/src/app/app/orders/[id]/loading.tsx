export default function OrderDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] p-6">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-surface-container)]" />
        <div className="h-6 w-32 animate-pulse rounded bg-[var(--color-surface-container)]" />
      </div>

      {/* Status skeleton */}
      <div className="mb-4 rounded-2xl bg-[var(--color-surface-container)] p-6">
        <div className="mb-3 h-5 w-24 animate-pulse rounded bg-[var(--color-surface-container-lowest)]" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 flex-1 animate-pulse rounded-full bg-[var(--color-surface-container-lowest)]"
            />
          ))}
        </div>
      </div>

      {/* Items skeleton */}
      <div className="space-y-3 rounded-2xl bg-[var(--color-surface-container)] p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-surface-container-lowest)]" />
            <div className="h-4 w-12 animate-pulse rounded bg-[var(--color-surface-container-lowest)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
