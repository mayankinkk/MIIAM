export default function AppLoading() {
  return (
    <div className="bg-surface min-h-screen pb-24">
      {/* Header skeleton */}
      <div className="bg-surface-container-lowest sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="bg-surface-container h-10 w-10 animate-pulse rounded-full" />
          <div className="bg-surface-container h-6 w-24 animate-pulse rounded" />
          <div className="bg-surface-container h-10 w-10 animate-pulse rounded-full" />
        </div>
      </div>

      {/* Breadcrumb skeleton */}
      <div className="border-outline-variant border-b px-6 py-2.5">
        <div className="bg-surface-container h-3 w-48 animate-pulse rounded" />
      </div>

      {/* Hero skeleton */}
      <div className="mt-4 px-6">
        <div className="bg-surface-container h-40 animate-pulse rounded-2xl" />
      </div>

      {/* Category pills skeleton */}
      <div className="bg-surface-container-lowest px-6 py-4">
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container h-9 w-20 animate-pulse rounded-full" />
          ))}
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest overflow-hidden rounded-2xl shadow-sm"
            >
              <div className="bg-surface-container h-32 w-full animate-pulse" />
              <div className="space-y-2 p-3">
                <div className="bg-surface-container h-4 w-3/4 animate-pulse rounded" />
                <div className="bg-surface-variant h-3 w-1/2 animate-pulse rounded" />
                <div className="mt-2 flex items-center justify-between">
                  <div className="bg-surface-container h-5 w-12 animate-pulse rounded" />
                  <div className="bg-surface-container h-8 w-8 animate-pulse rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
