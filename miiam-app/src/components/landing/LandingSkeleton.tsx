export default function LandingSkeleton() {
  return (
    <div className="min-h-[60vh] bg-[var(--color-background)]">
      {/* Hero skeleton */}
      <div className="h-[60vh] bg-gradient-to-br from-[#0f0f0f] to-[#1a0a0e] flex items-center px-6">
        <div className="space-y-4 w-full max-w-md">
          <div className="h-3 w-32 bg-white/10 rounded-full animate-pulse" />
          <div className="h-10 w-3/4 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-10 w-1/2 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-full bg-white/10 rounded mt-4 animate-pulse" />
          <div className="flex gap-3 mt-6">
            <div className="h-12 w-40 bg-white/10 rounded-2xl animate-pulse" />
            <div className="h-12 w-36 bg-white/10 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
      {/* Services skeleton */}
      <div className="max-w-5xl mx-auto px-6 -mt-8">
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 shadow-lg">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 py-3">
                <div className="w-12 h-12 bg-[var(--color-surface-subtle)] rounded-2xl animate-pulse" />
                <div className="h-2 w-10 bg-[var(--color-surface-subtle)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Features skeleton */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[var(--color-surface-subtle)] rounded-xl animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-[var(--color-surface-subtle)] rounded animate-pulse" />
                <div className="h-2 w-16 bg-[var(--color-surface-subtle)] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
