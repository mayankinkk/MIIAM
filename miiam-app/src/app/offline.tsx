export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
          <span className="material-symbols-outlined text-[40px] text-[var(--color-accent)]">
            wifi_off
          </span>
        </div>
        <h1 className="mb-2 text-xl font-extrabold text-[var(--color-on-surface)]">
          You&apos;re Offline
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-[var(--color-outline)]">
          No internet connection detected. Your recent activity is still available locally.
        </p>
        <div className="mb-8 space-y-3 text-left">
          <div className="flex items-start gap-3 text-sm text-[var(--color-outline)]">
            <span className="material-symbols-outlined mt-0.5 text-base text-[var(--color-accent)]">
              check_circle
            </span>
            <span>Cached orders, cart, and profile are still accessible</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-[var(--color-outline)]">
            <span className="material-symbols-outlined mt-0.5 text-base text-[var(--color-accent)]">
              info
            </span>
            <span>New orders will sync when you&apos;re back online</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="text-on-primary w-full rounded-2xl bg-[var(--color-primary)] px-6 py-3.5 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full rounded-2xl border border-[var(--color-border-subtle)] px-6 py-3.5 text-sm font-bold text-[var(--color-outline)] transition-all hover:bg-[var(--color-surface-container)] active:scale-[0.98]"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
