"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const fromVendor = searchParams.get("from") === "partner";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-container-lowest)] px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] animate-pulse">
          <span className="material-symbols-outlined text-5xl">lock</span>
        </div>

        {fromVendor ? (
          <>
            <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-on-surface)] mb-4">Vendor Access Only</h1>
            <p className="text-[var(--color-on-surface-variant)] text-lg mb-10 leading-relaxed">
              This section is for registered vendors only. Register your store to get access.
            </p>
            <div className="space-y-4">
              <Link
                href="/partner/register"
                className="block w-full bg-[var(--color-primary)] text-white rounded-xl py-4 font-bold shadow-lg shadow-red-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Register Your Store
              </Link>
              <Link
                href="/"
                className="block w-full bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] border-2 border-[var(--color-border-subtle)] rounded-xl py-4 font-bold hover:bg-[var(--color-surface-subtle)] transition-all"
              >
                Back to Home
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-on-surface)] mb-4">Access Denied</h1>
            <p className="text-[var(--color-on-surface-variant)] text-lg mb-10 leading-relaxed">
              You don't have the necessary permissions to access this area. Please contact the system administrator.
            </p>
            <div className="space-y-4">
              <Link
                href="/"
                className="block w-full bg-[var(--color-primary)] text-white rounded-xl py-4 font-bold shadow-lg shadow-red-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Back to Home
              </Link>
              <Link
                href="/auth/login"
                className="block w-full bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] border-2 border-[var(--color-border-subtle)] rounded-xl py-4 font-bold hover:bg-[var(--color-surface-subtle)] transition-all"
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-container-lowest)]"><div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /></div>}>
      <AccessDeniedContent />
    </Suspense>
  );
}
