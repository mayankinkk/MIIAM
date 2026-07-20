"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface OrderStep {
  id: number;
  label: string;
  completed: boolean;
  time: string;
}

interface ActiveOrder {
  id: string;
  vendor: string;
  items: string;
  steps: OrderStep[];
  eta: string;
}

interface ActiveOrderBubbleProps {
  activeOrder: ActiveOrder;
  expanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function ActiveOrderBubble({ activeOrder, expanded, onToggle, onClose }: ActiveOrderBubbleProps) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed bottom-20 right-4 z-40"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Expanded Order Details */}
      {expanded && (
        <div className="absolute bottom-16 right-0 w-72 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-2xl p-4 mb-2 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-600">delivery_dining</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">{activeOrder.vendor}</p>
                <p className="text-xs text-on-surface-variant">{activeOrder.items}</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close order details" className="text-gray-400 w-11 h-11 flex items-center justify-center rounded-full">
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="space-y-3">
            {activeOrder.steps.map((step: OrderStep, index: number) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-green-500' : index === 2 ? 'bg-orange-500 animate-pulse' : 'bg-surface-container-high'
                }`}>
                  {step.completed ? (
                    <span className="material-symbols-outlined text-white text-sm">check</span>
                  ) : index === 2 ? (
                    <span className="material-symbols-outlined text-white text-xs">local_shipping</span>
                  ) : (
                    <div className="w-2 h-2 bg-on-surface-variant/40 rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${step.completed ? 'text-on-surface' : index === 2 ? 'text-orange-600' : 'text-on-surface-variant/60'}`}>
                    {step.label}
                  </p>
                  {step.time && <p className="text-xs text-on-surface-variant/60">{step.time}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* ETA */}
          <div className="mt-4 p-3 bg-orange-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface-variant">{t.home.estimatedDelivery}</p>
              <p className="font-bold text-orange-600">{activeOrder.eta}</p>
            </div>
            <Link href={`/app/orders/${activeOrder.id}`} className="text-primary font-bold text-sm">
              {t.home.trackOrder}
            </Link>
          </div>
        </div>
      )}

      {/* Bubble Button */}
      <button
        onClick={onToggle}
        aria-label="Toggle order details"
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
          expanded ? 'bg-primary' : 'bg-surface-container-lowest border border-outline-variant/15'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${
          expanded ? 'text-white' : 'text-orange-600'
        }`}>
          delivery_dining
        </span>
      </button>
    </div>
  );
}
