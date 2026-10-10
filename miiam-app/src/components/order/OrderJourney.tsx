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
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm sm:p-8">
      <h2 className="text-on-surface mb-6 text-xl font-extrabold tracking-tight sm:mb-8">
        {t.orders.orderJourney}
      </h2>
      <div className="relative space-y-0">
        <div className="from-primary via-primary to-outline absolute top-4 bottom-10 left-[19px] w-0.5 bg-gradient-to-b" />

        {steps.map((step, index) => {
          const isCompleted = currentStepIndex >= index;
          const isCurrent = currentStepIndex === index;
          const isPending = currentStepIndex < index;

          return (
            <div
              key={step.key}
              className={`relative flex min-w-0 items-start gap-3 pb-6 sm:gap-6 sm:pb-8 ${isPending ? "opacity-40" : ""}`}
            >
              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  isCurrent
                    ? "bg-primary text-on-primary shadow-primary/20 ring-primary-container/30 shadow-lg ring-4"
                    : isCompleted
                      ? "bg-primary text-on-primary shadow-md"
                      : "bg-on-background text-outline"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-xl ${isCurrent ? "animate-pulse" : ""}`}
                  style={{
                    fontVariationSettings: isCurrent || isCompleted ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {isCompleted && !isCurrent ? "check" : step.icon}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4
                  className={`text-md font-bold ${isCurrent ? "text-accent" : isCompleted ? "text-on-surface" : "text-outline"}`}
                >
                  {step.label}
                </h4>
                <p
                  className={`text-sm ${isCurrent ? "text-on-surface font-medium" : "text-on-surface-variant"}`}
                >
                  {isCurrent
                    ? step.key === "on_the_way" && trackingInfo
                      ? `${trackingInfo.distance} away · ${trackingInfo.eta} min ETA`
                      : step.key === "delivered"
                        ? "Order delivered successfully"
                        : step.key === "accepted"
                          ? "Vendor has accepted your order"
                          : step.key === "preparing"
                            ? "Restaurant is preparing your food"
                            : step.key === "ready_for_pickup"
                              ? "Food is ready! Waiting for rider pickup"
                              : step.key === "shopping"
                                ? "Rider is picking your items at the store"
                                : step.key === "picked_up"
                                  ? "Rider has your order and is on the way! 🛵"
                                  : step.key === "processing"
                                    ? "We're printing your documents"
                                    : "In progress"
                    : isCompleted
                      ? step.key === "pending"
                        ? "Order placed successfully"
                        : step.key === "delivered"
                          ? "Delivered"
                          : "Completed"
                      : "Pending"}
                </p>
                {isCurrent && (
                  <p className="text-accent/60 mt-1 text-xs font-bold tracking-tighter uppercase">
                    Current Step • {step.time}
                  </p>
                )}
                {isCompleted && !isCurrent && (
                  <p className="text-outline mt-1 text-xs font-medium">{step.time}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
