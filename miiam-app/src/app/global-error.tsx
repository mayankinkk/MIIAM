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
      <body className="bg-[#fff4f4] min-h-screen">
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-red-600">error</span>
            </div>
            <h1 className="text-2xl font-black text-[#4d212a] mb-2">Something went wrong</h1>
            <p className="text-[#814c55] mb-2">
              An unexpected error occurred. Our team has been notified.
            </p>
            
            {error.digest && (
              <p className="text-xs text-slate-400 mb-4">Error ID: {error.digest}</p>
            )}
            
            {showDetails && (
              <div className="bg-slate-100 p-4 rounded-xl text-left mb-4 overflow-auto max-h-32">
                <p className="text-xs text-slate-600 font-mono break-words">
                  {error.message || "Unknown error"}
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => reset()}
                className="px-6 py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                {showDetails ? "Hide Details" : "Show Details"}
              </button>
              <Link
                href="/"
                className="text-sm text-[#ba001c] font-bold hover:underline"
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