"use client";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = "Something went wrong",
  description = "Please try again or contact support if the problem persists.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-20 h-20 rounded-full bg-[var(--color-error-container)]/10 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-4xl text-[var(--color-error)]">error</span>
      </div>
      <h3 className="font-bold text-[var(--color-on-surface)] text-lg mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-on-surface-variant)] max-w-[280px] mb-4">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold rounded-xl hover:bg-[var(--color-primary-dim)] transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
