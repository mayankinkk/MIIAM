"use client";

interface PendingOrderCardProps {
  type: "food" | "print";
  findingRiderLabel?: string;
  riderWillAcceptLabel?: string;
}

export default function PendingOrderCard({
  type,
  findingRiderLabel = "Finding a rider...",
  riderWillAcceptLabel = "A rider will accept your order shortly",
}: PendingOrderCardProps) {
  if (type === "print") {
    return (
      <div className="bg-surface-container-lowest relative overflow-hidden rounded-2xl p-4 shadow-sm sm:p-6">
        <div className="bg-accent/10 absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full blur-2xl" />
        <div className="relative z-10 flex min-w-0 items-center gap-3 sm:gap-6">
          <div className="border-surface-container bg-accent/10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 object-cover sm:h-20 sm:w-20">
            <span
              className="material-symbols-outlined text-accent text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              print
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-on-surface text-xl font-bold tracking-tight">Order Received</h3>
            <p className="text-on-surface-variant font-medium">
              We&apos;re reviewing your print order
            </p>
            <p className="text-accent mt-2 flex items-center gap-1 text-xs font-bold">
              <span className="bg-accent h-2 w-2 animate-pulse rounded-full" />
              Preparing your documents for printing...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest relative overflow-hidden rounded-2xl p-4 shadow-sm sm:p-6">
      <div className="bg-secondary-container/20 absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full blur-2xl" />
      <div className="relative z-10 flex min-w-0 items-center gap-3 sm:gap-6">
        <div className="border-surface-container bg-surface-container flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 object-cover sm:h-20 sm:w-20">
          <span
            className="material-symbols-outlined text-accent text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            person_search
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-on-surface text-xl font-bold tracking-tight">{findingRiderLabel}</h3>
          <p className="text-on-surface-variant font-medium">{riderWillAcceptLabel}</p>
          <p className="text-accent mt-2 flex items-center gap-1 text-xs font-bold">
            <span className="bg-primary h-2 w-2 animate-pulse rounded-full" />
            Waiting for rider acceptance...
          </p>
        </div>
      </div>
    </div>
  );
}
