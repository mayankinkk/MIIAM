"use client";

import { GlobalError } from "@/components/ErrorBoundary";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-[#fff4f4]">
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 bg-[#ba001c]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-[#ba001c]">error_outline</span>
            </div>
            <h1 className="text-2xl font-bold text-[#4d212a] mb-2">Application Error</h1>
            <p className="text-[#814c55] mb-4">
              A critical error occurred. Please refresh the page.
            </p>
            {error?.digest && (
              <p className="text-xs text-[#a06770] mb-4">Error ID: {error.digest}</p>
            )}
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}