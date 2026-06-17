"use client";

import type { OrderWithTiming } from "@/app/rider/dashboard/types";
import { calculatePeakEarnings } from "@/app/rider/dashboard/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface NewOrderBannerProps {
  visible: boolean;
  order: OrderWithTiming | null;
  onView: () => void;
  onDismiss: () => void;
}

export default function NewOrderBanner({ visible, order, onView, onDismiss }: NewOrderBannerProps) {
  const { t } = useTranslation();

  if (!visible || !order) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-[90] bg-gradient-to-r from-brand-secondary to-[#0044bf] text-white p-3 flex items-center justify-between shadow-lg animate-slide-down">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined animate-bounce">local_shipping</span>
        <div>
          <p className="font-bold text-sm">{t.rider.banner.newOrderAvailable}</p>
          <p className="text-xs opacity-80">{order.type === "multi_stop" ? `${order.stops?.length} stops` : order.items} items • ₹{calculatePeakEarnings(order)}</p>
        </div>
      </div>
      <button 
        onClick={onView}
        className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold"
      >
{t.rider.banner.view}
      </button>
    </div>
  );
}
