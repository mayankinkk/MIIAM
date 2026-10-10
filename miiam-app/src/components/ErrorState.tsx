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
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-error-container)]/10">
        <span className="material-symbols-outlined text-4xl text-[var(--color-error)]">error</span>
      </div>
      <h3 className="mb-1 text-lg font-bold text-[var(--color-on-surface)]">{title}</h3>
      <p className="mb-4 max-w-[280px] text-sm text-[var(--color-on-surface-variant)]">
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-dim)]"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
