"use client";

import { useEffect } from "react";

export default function AdminPageError({
  error,
  reset,
  title = "Page Error",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    console.error(`[${title}]`, error);
  }, [error, title]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <span className="material-symbols-outlined text-6xl text-[var(--color-primary)] mb-4">error_outline</span>
      <h2 className="text-xl font-black text-[var(--color-on-surface)] mb-2">{title}</h2>
      <p className="text-sm text-[var(--color-outline)] mb-1 max-w-md">
        Something went wrong loading this page. You can try again or go back to the dashboard.
      </p>
      {error.digest && (
        <p className="text-xs text-[var(--color-outline-variant)] mb-4 font-mono">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
        <a
          href="/admin"
          className="px-6 py-3 bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] rounded-xl font-bold hover:bg-[var(--color-surface-container-high)] transition-colors"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
