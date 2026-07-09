export default function OrderDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] p-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[var(--color-surface-container)] rounded-full animate-pulse" />
        <div className="h-6 w-32 bg-[var(--color-surface-container)] rounded animate-pulse" />
      </div>

      {/* Status skeleton */}
      <div className="bg-[var(--color-surface-container)] rounded-2xl p-6 mb-4">
        <div className="h-5 w-24 bg-[var(--color-surface-container-lowest)] rounded animate-pulse mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 flex-1 bg-[var(--color-surface-container-lowest)] rounded-full animate-pulse" />
          ))}
        </div>
      </div>

      {/* Items skeleton */}
      <div className="bg-[var(--color-surface-container)] rounded-2xl p-6 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-4 w-32 bg-[var(--color-surface-container-lowest)] rounded animate-pulse" />
            <div className="h-4 w-12 bg-[var(--color-surface-container-lowest)] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
