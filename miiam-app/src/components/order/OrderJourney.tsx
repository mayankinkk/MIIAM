"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface StepDef {
  key: string;
  label: string;
  icon: string;
  time: string;
}

interface TrackingInfo {
  eta: number;
  distance: string;
  leg: "to_pickup" | "to_drop";
}

interface OrderJourneyProps {
  steps: StepDef[];
  currentStepIndex: number;
  trackingInfo: TrackingInfo | null;
}

export default function OrderJourney({ steps, currentStepIndex, trackingInfo }: OrderJourneyProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-8 shadow-sm">
      <h2 className="text-xl font-extrabold tracking-tight mb-6 sm:mb-8 text-on-surface">{t.orders.orderJourney}</h2>
      <div className="space-y-0 relative">
        <div className="absolute left-[19px] top-4 bottom-10 w-0.5 bg-gradient-to-b from-primary via-primary to-outline" />

        {steps.map((step, index) => {
          const isCompleted = currentStepIndex >= index;
          const isCurrent = currentStepIndex === index;
          const isPending = currentStepIndex < index;

          return (
            <div key={step.key} className={`relative flex items-start gap-3 sm:gap-6 pb-6 sm:pb-8 min-w-0 ${isPending ? "opacity-40" : ""}`}>
              <div className={`relative z-10 w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                isCurrent
                  ? "bg-primary text-white shadow-lg shadow-primary/20 ring-4 ring-primary-container/30"
                  : isCompleted
                    ? "bg-primary text-white shadow-md"
                    : "bg-on-background text-outline"
              }`}>
                <span className={`material-symbols-outlined text-xl ${isCurrent ? "animate-pulse" : ""}`} style={{ fontVariationSettings: isCurrent || isCompleted ? "'FILL' 1" : "'FILL' 0" }}>
                  {isCompleted && !isCurrent ? "check" : step.icon}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`text-md font-bold ${isCurrent ? "text-primary" : isCompleted ? "text-on-surface" : "text-outline"}`}>
                  {step.label}
                </h4>
                <p className={`text-sm ${isCurrent ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>
                  {isCurrent ? (
                    step.key === "on_the_way" && trackingInfo
                      ? `${trackingInfo.distance} away · ${trackingInfo.eta} min ETA`
                      : step.key === "delivered"
                      ? "Order delivered successfully"
                      : step.key === "accepted"
                      ? "Rider is heading to pickup"
                      : step.key === "picking_up"
                      ? "Rider is picking up your order"
                      : step.key === "preparing"
                      ? "Restaurant is preparing your food"
                      : step.key === "processing"
                      ? "We're printing your documents"
                      : step.key === "shopping"
                      ? "Rider is shopping for your items"
                      : step.key === "ready_for_pickup"
                      ? "Your order is ready! Waiting for rider pickup"
                      : "In progress"
                  ) : isCompleted ? (
                    step.key === "pending" ? "Order placed successfully" :
                    step.key === "delivered" ? "Delivered" : "Completed"
                  ) : "Pending"}
                </p>
                {isCurrent && (
                  <p className="text-xs text-primary/60 font-bold mt-1 uppercase tracking-tighter">Current Step • {step.time}</p>
                )}
                {isCompleted && !isCurrent && (
                  <p className="text-xs text-outline font-medium mt-1">{step.time}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
