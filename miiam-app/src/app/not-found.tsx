import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface-container-lowest)] p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
          <span className="material-symbols-outlined text-5xl text-[var(--color-accent)]">
            search_off
          </span>
        </div>
        <h1 className="mb-2 text-3xl font-black text-[var(--color-on-surface)]">404</h1>
        <h2 className="mb-2 text-xl font-bold text-[var(--color-on-surface)]">Page Not Found</h2>
        <p className="mb-8 text-[var(--color-on-surface-variant)]">
          The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="text-on-primary block w-full rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold transition-opacity hover:opacity-90"
          >
            Go Home
          </Link>
          <Link
            href="/app/home"
            className="block w-full rounded-xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-6 py-3 font-bold text-[var(--color-on-surface)] transition-colors hover:border-[var(--color-primary)]"
          >
            Open App
          </Link>
        </div>

        <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-6">
          <p className="mb-3 text-sm text-[var(--color-outline)]">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/app/food"
              className="rounded-full bg-[var(--color-surface-container)] px-3 py-1 text-xs text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
            >
              Food
            </Link>
            <Link
              href="/app/services"
              className="rounded-full bg-[var(--color-surface-container)] px-3 py-1 text-xs text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
            >
              Services
            </Link>
            <Link
              href="/app/store"
              className="rounded-full bg-[var(--color-surface-container)] px-3 py-1 text-xs text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
            >
              Store
            </Link>
            <Link
              href="/partner"
              className="rounded-full bg-[var(--color-surface-container)] px-3 py-1 text-xs text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
