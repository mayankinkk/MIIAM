export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] p-6">
      {/* Search bar skeleton */}
      <div className="h-12 bg-[var(--color-surface-container)] rounded-full animate-pulse mb-6" />

      {/* Recent searches skeleton */}
      <div className="space-y-3 mb-8">
        <div className="h-4 w-32 bg-[var(--color-surface-container)] rounded animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-4 w-48 bg-[var(--color-surface-container)] rounded animate-pulse" />
        ))}
      </div>

      {/* Results skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-16 h-16 bg-[var(--color-surface-container)] rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-[var(--color-surface-container)] rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-[var(--color-surface-container)] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
