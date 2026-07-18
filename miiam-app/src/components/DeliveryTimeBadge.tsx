"use client";

interface DeliveryTimeBadgeProps {
  min: number;
  max: number;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

export default function DeliveryTimeBadge({ min, max, variant = "default", className = "" }: DeliveryTimeBadgeProps) {
  if (variant === "compact") {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant ${className}`}>
        <span className="material-symbols-outlined text-sm">schedule</span>
        {min}–{max} min
      </span>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`flex items-center gap-3 p-3 bg-surface-container rounded-xl ${className}`}>
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-lg">delivery_dining</span>
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">Delivery Time</p>
          <p className="text-xs text-on-surface-variant">
            Estimated {min}–{max} minutes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-full ${className}`}>
      <span className="material-symbols-outlined text-sm text-primary">schedule</span>
      <span className="text-xs font-bold text-on-surface">{min}–{max} min</span>
    </div>
  );
}
