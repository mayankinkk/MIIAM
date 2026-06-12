"use client";

import { useEffect } from "react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  icon?: string;
}

export default function ErrorBoundary({
  error,
  reset,
  title = "Something went wrong",
  description = "We encountered an error loading this page. Please try again.",
  icon = "error_outline",
}: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="text-center max-w-md">
        <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
          {icon}
        </span>
        <h1 className="text-2xl font-black text-on-surface mb-2">{title}</h1>
        <p className="text-on-surface-variant mb-6">{description}</p>
        {error.digest && (
          <p className="text-xs text-on-surface-variant/50 mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dim transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
