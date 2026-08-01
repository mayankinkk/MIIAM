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

export default function EmptyState({ icon = "inbox", title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="w-20 h-20 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-4xl text-[var(--color-outline)]">{icon}</span>
      </div>
      <h3 className="font-bold text-[var(--color-on-surface)] text-lg mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-on-surface-variant)] max-w-[280px]">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold rounded-xl hover:bg-[var(--color-primary-dim)] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
