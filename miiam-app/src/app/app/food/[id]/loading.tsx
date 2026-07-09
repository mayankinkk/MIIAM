export default function FoodDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] pb-24">
      {/* Image skeleton */}
      <div className="w-full h-64 bg-[var(--color-surface-container)] animate-pulse" />

      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        <div className="h-6 w-3/4 bg-[var(--color-surface-container)] rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-[var(--color-surface-container)] rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-[var(--color-surface-container)] rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-[var(--color-surface-container)] rounded-full animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-[var(--color-surface-container)] rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
