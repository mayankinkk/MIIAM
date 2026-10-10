"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-[var(--color-surface-container-lowest)]">
        <div className="flex min-h-screen flex-col items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
              <span className="material-symbols-outlined text-5xl text-red-600">error</span>
            </div>
            <h1 className="mb-2 text-2xl font-black text-[var(--color-on-surface)]">
              Something went wrong
            </h1>
            <p className="mb-2 text-[var(--color-on-surface-variant)]">
              An unexpected error occurred. Our team has been notified.
            </p>

            {error.digest && (
              <p className="mb-4 text-xs text-[var(--color-outline-variant)]">
                Error ID: {error.digest}
              </p>
            )}

            {showDetails && (
              <div className="mb-4 max-h-32 overflow-auto rounded-xl bg-[var(--color-surface-container)] p-4 text-left">
                <p className="font-mono text-xs break-words text-[var(--color-on-surface-variant)]">
                  {error.message || "Unknown error"}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => reset()}
                className="text-on-primary rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold transition-opacity hover:opacity-90"
              >
                Try Again
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-[var(--color-outline)] hover:text-[var(--color-on-surface)]"
              >
                {showDetails ? "Hide Details" : "Show Details"}
              </button>
              <Link
                href="/"
                className="text-sm font-bold text-[var(--color-accent)] hover:underline"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
