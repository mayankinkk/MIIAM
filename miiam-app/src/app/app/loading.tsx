export default function AppLoading() {
  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header skeleton */}
      <div className="bg-surface-container-lowest px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-surface-container rounded-full animate-pulse" />
          <div className="h-6 w-24 bg-surface-container rounded animate-pulse" />
          <div className="w-10 h-10 bg-surface-container rounded-full animate-pulse" />
        </div>
      </div>

      {/* Breadcrumb skeleton */}
      <div className="px-6 py-2.5 border-b border-outline-variant">
        <div className="h-3 w-48 bg-surface-container rounded animate-pulse" />
      </div>

      {/* Hero skeleton */}
      <div className="px-6 mt-4">
        <div className="rounded-2xl h-40 bg-surface-container animate-pulse" />
      </div>

      {/* Category pills skeleton */}
      <div className="bg-surface-container-lowest px-6 py-4">
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-9 w-20 bg-surface-container rounded-full animate-pulse" />
          ))}
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
              <div className="w-full h-32 bg-surface-container animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-surface-container rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-surface-variant rounded w-1/2 animate-pulse" />
                <div className="flex items-center justify-between mt-2">
                  <div className="h-5 bg-surface-container rounded w-12 animate-pulse" />
                  <div className="w-8 h-8 bg-surface-container rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
