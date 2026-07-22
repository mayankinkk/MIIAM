"use client";

interface OrderStatusBannerProps {
  type: "delay" | "prep_time";
  delayMinutes?: number;
  delayReason?: string;
  estimatedPrepTime?: number;
  placedAt?: string;
  preparingLabel?: string;
}

export default function OrderStatusBanner({
  type,
  delayMinutes,
  delayReason,
  estimatedPrepTime,
  placedAt,
  preparingLabel,
}: OrderStatusBannerProps) {
  if (type === "delay" && delayMinutes && delayMinutes > 0) {
    return (
      <div className="bg-status-error/10 border border-status-error/20 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-status-error text-2xl mt-0.5">warning</span>
        <div>
          <p className="font-bold text-status-error">Order is Delayed</p>
          <p className="text-sm text-status-error">
            {delayReason
              ? `${delayReason} — approximately ${delayMinutes} min extra`
              : `Approximately ${delayMinutes} min extra wait time`}
          </p>
        </div>
      </div>
    );
  }

  if (type === "prep_time" && estimatedPrepTime && placedAt) {
    const t = new Date(new Date(placedAt).getTime() + estimatedPrepTime * 60000);
    return (
      <div className="bg-status-warning/10 border border-status-warning/20 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-status-warning text-2xl mt-0.5">timer</span>
        <div>
          <p className="font-bold text-status-warning">{preparingLabel || "Preparing your order"}</p>
          <p className="text-sm text-status-warning">
            Estimated ready by {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
