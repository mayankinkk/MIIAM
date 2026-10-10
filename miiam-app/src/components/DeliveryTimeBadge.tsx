"use client";

interface DeliveryTimeBadgeProps {
  min: number;
  max: number;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

export default function DeliveryTimeBadge({
  min,
  max,
  variant = "default",
  className = "",
}: DeliveryTimeBadgeProps) {
  if (variant === "compact") {
    return (
      <span
        className={`text-on-surface-variant inline-flex items-center gap-1 text-xs font-bold ${className}`}
      >
        <span className="material-symbols-outlined text-sm">schedule</span>
        {min}–{max} min
      </span>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`bg-surface-container flex items-center gap-3 rounded-xl p-3 ${className}`}>
        <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <span className="material-symbols-outlined text-accent text-lg">delivery_dining</span>
        </div>
        <div>
          <p className="text-on-surface text-sm font-bold">Delivery Time</p>
          <p className="text-on-surface-variant text-xs">
            Estimated {min}–{max} minutes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-surface-container inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${className}`}
    >
      <span className="material-symbols-outlined text-accent text-sm">schedule</span>
      <span className="text-on-surface text-xs font-bold">
        {min}–{max} min
      </span>
    </div>
  );
}
