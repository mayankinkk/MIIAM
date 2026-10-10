export default function FoodDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] pb-24">
      {/* Image skeleton */}
      <div className="h-64 w-full animate-pulse bg-[var(--color-surface-container)]" />

      {/* Content skeleton */}
      <div className="space-y-4 p-6">
        <div className="h-6 w-3/4 animate-pulse rounded bg-[var(--color-surface-container)]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-surface-container)]" />
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-[var(--color-surface-container)]" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--color-surface-container)]" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-[var(--color-surface-container)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
