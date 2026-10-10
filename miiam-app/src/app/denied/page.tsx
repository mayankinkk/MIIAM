"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const fromVendor = searchParams.get("from") === "partner";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)] px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 inline-flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-accent)]">
          <span className="material-symbols-outlined text-5xl">lock</span>
        </div>

        {fromVendor ? (
          <>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
              Vendor Access Only
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-[var(--color-on-surface-variant)]">
              This section is for registered vendors only. Register your store to get access.
            </p>
            <div className="space-y-4">
              <Link
                href="/partner/register"
                className="text-on-primary block w-full rounded-xl bg-[var(--color-primary)] py-4 font-bold shadow-lg shadow-red-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Register Your Store
              </Link>
              <Link
                href="/"
                className="block w-full rounded-xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] py-4 font-bold text-[var(--color-on-surface)] transition-all hover:bg-[var(--color-surface-subtle)]"
              >
                Back to Home
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
              Access Denied
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-[var(--color-on-surface-variant)]">
              You don't have the necessary permissions to access this area. Please contact the
              system administrator.
            </p>
            <div className="space-y-4">
              <Link
                href="/"
                className="text-on-primary block w-full rounded-xl bg-[var(--color-primary)] py-4 font-bold shadow-lg shadow-red-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Back to Home
              </Link>
              <Link
                href="/auth/login"
                className="block w-full rounded-xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] py-4 font-bold text-[var(--color-on-surface)] transition-all hover:bg-[var(--color-surface-subtle)]"
              >
                Sign in with another account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AccessDenied() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
