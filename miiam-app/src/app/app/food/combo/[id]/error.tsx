"use client";

import Link from "next/link";

export default function ComboError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-surface flex min-h-screen flex-col items-center justify-center p-6">
      <p className="text-on-surface mb-2 text-xl font-black">Something went wrong</p>
      <p className="text-on-surface-variant mb-4 text-sm">{error.message}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-primary text-on-primary rounded-xl px-4 py-2 text-sm font-bold"
        >
          Try again
        </button>
        <Link
          href="/app/home"
          className="bg-surface-container text-on-surface rounded-xl px-4 py-2 text-sm font-bold"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
