"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <span className="material-symbols-outlined text-6xl text-primary mb-4 block">error_outline</span>
        <h1 className="text-2xl font-black text-on-surface mb-2">Home error</h1>
        <p className="text-on-surface-variant mb-6">
          We encountered an error loading this page. Please try again.
        </p>
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
