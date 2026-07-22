"use client";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: "Pending", color: "text-status-warning", bg: "bg-status-warning/10 dark:bg-status-warning/30 dark:text-status-warning", icon: "hourglass_empty" },
  confirmed: { label: "Confirmed", color: "text-status-info", bg: "bg-status-info/10 dark:bg-status-info/30 dark:text-status-info", icon: "check_circle" },
  preparing: { label: "Preparing", color: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400", icon: "skillet" },
  out_for_delivery: { label: "On the Way", color: "text-purple-700", bg: "bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400", icon: "delivery_dining" },
  delivered: { label: "Delivered", color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "task_alt" },
  cancelled: { label: "Cancelled", color: "text-status-error", bg: "bg-status-error/10 dark:bg-status-error/30 dark:text-status-error", icon: "cancel" },
  refunded: { label: "Refunded", color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-800 dark:text-gray-400", icon: "replay" },
};

interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export default function OrderStatusBadge({ status, size = "sm", showIcon = true }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${config.bg} ${config.color} ${sizeClasses}`}>
      {showIcon && (
        <span className="material-symbols-outlined" style={{ fontSize: size === "sm" ? "12px" : "14px", fontVariationSettings: "'FILL' 1" }}>
          {config.icon}
        </span>
      )}
      {config.label}
    </span>
  );
}
