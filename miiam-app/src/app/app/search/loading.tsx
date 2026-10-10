export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] p-6">
      {/* Search bar skeleton */}
      <div className="mb-6 h-12 animate-pulse rounded-full bg-[var(--color-surface-container)]" />

      {/* Recent searches skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-surface-container)]" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-4 w-48 animate-pulse rounded bg-[var(--color-surface-container)]"
          />
        ))}
      </div>

      {/* Results skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-16 w-16 animate-pulse rounded-xl bg-[var(--color-surface-container)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-surface-container)]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--color-surface-container)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
