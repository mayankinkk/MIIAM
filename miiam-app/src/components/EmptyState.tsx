"use client";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface-container)]">
        <span className="material-symbols-outlined text-4xl text-[var(--color-outline)]">
          {icon}
        </span>
      </div>
      <h3 className="mb-1 text-lg font-bold text-[var(--color-on-surface)]">{title}</h3>
      {description && (
        <p className="max-w-[280px] text-sm text-[var(--color-on-surface-variant)]">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-dim)]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
