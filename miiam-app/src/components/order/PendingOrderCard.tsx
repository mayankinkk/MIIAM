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
      <div className="relative bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/40 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="flex items-center gap-3 sm:gap-6 relative z-10 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full object-cover border-4 border-surface-container bg-indigo-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>print</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold tracking-tight text-on-surface">Order Received</h3>
            <p className="text-on-surface-variant font-medium">We&apos;re reviewing your print order</p>
            <p className="text-xs text-indigo-600 font-bold mt-2 flex items-center gap-1">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              Preparing your documents for printing...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#c4d0ff]/20 rounded-full -mr-16 -mt-16 blur-2xl" />
      <div className="flex items-center gap-3 sm:gap-6 relative z-10 min-w-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full object-cover border-4 border-surface-container bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold tracking-tight text-on-surface">{findingRiderLabel}</h3>
          <p className="text-on-surface-variant font-medium">{riderWillAcceptLabel}</p>
          <p className="text-xs text-primary font-bold mt-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Waiting for rider acceptance...
          </p>
        </div>
      </div>
    </div>
  );
}
