export default function LandingSkeleton() {
  return (
    <div className="min-h-[60vh] bg-[var(--color-background)]">
      {/* Hero skeleton */}
      <div className="flex h-[60vh] items-center bg-gradient-to-br from-[#0f0f0f] to-[#1a0a0e] px-6">
        <div className="w-full max-w-md space-y-4">
          <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-white/10" />
          <div className="h-10 w-1/2 animate-pulse rounded-lg bg-white/10" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/10" />
          <div className="mt-6 flex gap-3">
            <div className="h-12 w-40 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-12 w-36 animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
      {/* Services skeleton */}
      <div className="mx-auto -mt-8 max-w-5xl px-6">
        <div className="rounded-3xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 py-3">
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-[var(--color-surface-subtle)]" />
                <div className="h-2 w-10 animate-pulse rounded bg-[var(--color-surface-subtle)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Features skeleton */}
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-[var(--color-surface-subtle)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-surface-subtle)]" />
                <div className="h-2 w-16 animate-pulse rounded bg-[var(--color-surface-subtle)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
