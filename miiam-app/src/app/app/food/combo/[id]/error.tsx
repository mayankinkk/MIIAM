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
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6">
      <p className="text-xl font-black text-on-surface mb-2">Something went wrong</p>
      <p className="text-sm text-on-surface-variant mb-4">{error.message}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm"
        >
          Try again
        </button>
        <Link
          href="/app/home"
          className="px-4 py-2 bg-surface-container rounded-xl font-bold text-sm text-on-surface"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}