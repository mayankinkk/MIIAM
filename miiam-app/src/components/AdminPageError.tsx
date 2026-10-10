"use client";

import { useEffect } from "react";
import logger from "@/lib/logger";

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
    logger.error(
      { err: error instanceof Error ? error : new Error(String(error)), title },
      `Page error: ${title}`
    );
  }, [error, title]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <span className="material-symbols-outlined mb-4 text-6xl text-[var(--color-accent)]">
        error_outline
      </span>
      <h2 className="mb-2 text-xl font-black text-[var(--color-on-surface)]">{title}</h2>
      <p className="mb-1 max-w-md text-sm text-[var(--color-outline)]">
        Something went wrong loading this page. You can try again or go back to the dashboard.
      </p>
      {error.digest && (
        <p className="mb-4 font-mono text-xs text-[var(--color-outline-variant)]">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="text-on-primary rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold transition-opacity hover:opacity-90"
        >
          Try Again
        </button>
        <a
          href="/admin"
          className="rounded-xl bg-[var(--color-surface-container)] px-6 py-3 font-bold text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-high)]"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
