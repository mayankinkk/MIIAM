export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-5">
          <span className="material-symbols-outlined text-[var(--color-primary)] text-[40px]">
            wifi_off
          </span>
        </div>
        <h1 className="text-xl font-extrabold text-[var(--color-on-surface)] mb-2">
          You&apos;re Offline
        </h1>
        <p className="text-sm text-[var(--color-outline)] leading-relaxed mb-8">
          No internet connection detected. Your recent activity is still
          available locally.
        </p>
        <div className="space-y-3 text-left mb-8">
          <div className="flex items-start gap-3 text-sm text-[var(--color-outline)]">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-base mt-0.5">
              check_circle
            </span>
            <span>Cached orders, cart, and profile are still accessible</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-[var(--color-outline)]">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-base mt-0.5">
              info
            </span>
            <span>New orders will sync when you&apos;re back online</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 px-6 rounded-2xl bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full py-3.5 px-6 rounded-2xl border border-[var(--color-border-subtle)] text-[var(--color-outline)] text-sm font-bold hover:bg-[var(--color-surface-container)] active:scale-[0.98] transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
