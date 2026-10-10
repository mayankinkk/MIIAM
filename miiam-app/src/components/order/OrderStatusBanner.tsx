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
      <div className="bg-status-error/10 border-status-error/20 flex items-start gap-3 rounded-xl border p-4">
        <span className="material-symbols-outlined text-status-error mt-0.5 text-2xl">warning</span>
        <div>
          <p className="text-status-error font-bold">Order is Delayed</p>
          <p className="text-status-error text-sm">
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
      <div className="bg-status-warning/10 border-status-warning/20 flex items-start gap-3 rounded-xl border p-4">
        <span className="material-symbols-outlined text-status-warning mt-0.5 text-2xl">timer</span>
        <div>
          <p className="text-status-warning font-bold">
            {preparingLabel || "Preparing your order"}
          </p>
          <p className="text-status-warning text-sm">
            Estimated ready by {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
