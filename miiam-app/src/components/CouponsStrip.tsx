"use client";

import { useState, useEffect } from "react";

interface Coupon {
  code: string;
  label: string;
  sublabel: string;
  color: string;
}

const defaultCoupons: Coupon[] = [
  { code: "FREEDEL", label: "FREE DELIVERY", sublabel: "On orders above ₹199", color: "from-accent to-accent/80" },
  { code: "SAVE50", label: "50% OFF", sublabel: "Up to ₹100 on first order", color: "from-deal to-deal/80" },
  { code: "FLAT30", label: "FLAT ₹30 OFF", sublabel: "On orders above ₹149", color: "from-primary to-primary/80" },
];

export default function CouponsStrip() {
  const [dismissed, setDismissed] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem("miiam-coupons-dismissed") === "1");
    } catch {}
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("miiam-coupons-dismissed", "1");
    } catch {}
  };

  if (dismissed) return null;

  return (
    <div className="px-4 pb-2">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto">
        {defaultCoupons.map((coupon) => (
          <button
            key={coupon.code}
            onClick={() => {
              setApplied(applied === coupon.code ? null : coupon.code);
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2 transition-all ${
              applied === coupon.code
                ? "bg-accent/10 ring-accent ring-2"
                : `bg-gradient-to-r ${coupon.color}`
            }`}
            aria-label={`Apply coupon ${coupon.code}`}
          >
            <span className="material-symbols-outlined text-sm text-white" aria-hidden="true">
              local_offer
            </span>
            <div className="text-left">
              <p className={`text-[11px] font-black ${applied === coupon.code ? "text-accent" : "text-white"}`}>
                {coupon.label}
              </p>
              <p className={`text-[9px] font-medium ${applied === coupon.code ? "text-accent/70" : "text-white/80"}`}>
                {coupon.sublabel}
              </p>
            </div>
            {applied === coupon.code && (
              <span className="material-symbols-outlined text-sm text-accent" aria-hidden="true">
                check_circle
              </span>
            )}
          </button>
        ))}
        <button
          onClick={handleDismiss}
          className="bg-surface-container flex h-9 w-9 flex-shrink-0 items-center justify-center self-center rounded-full"
          aria-label="Dismiss coupons"
        >
          <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">
            close
          </span>
        </button>
      </div>
    </div>
  );
}
