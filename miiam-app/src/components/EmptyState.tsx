interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <span className="text-7xl mb-4">{icon}</span>
      <h3 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">{title}</h3>
      <p className="text-[var(--color-on-surface-variant)] text-sm max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-6 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}