"use client";

type BadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary:
    "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  secondary:
    "bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]",
  success:
    "bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]",
  warning:
    "bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)]",
  error:
    "bg-[var(--color-status-error)]/10 text-[var(--color-status-error)]",
  info:
    "bg-[var(--color-status-info)]/10 text-[var(--color-status-info)]",
  neutral:
    "bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-[10px] px-2 py-0.5 gap-1",
  md: "text-xs px-3 py-1 gap-1.5",
  lg: "text-sm px-4 py-1.5 gap-2",
};

function Badge({
  variant = "primary",
  size = "sm",
  dot = false,
  pulse = false,
  className = "",
  children,
}: BadgeProps) {
  const classes = [
    "inline-flex items-center font-bold uppercase tracking-wider rounded-full select-none",
    variantStyles[variant],
    sizeStyles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`}
        />
      )}
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant, BadgeSize };
