"use client";

import { useRef, useState } from "react";
import PrintReceipt, { PrintReceiptHandle, ReceiptOrder } from "./PrintReceipt";

interface Props {
  order: ReceiptOrder;
  customerName?: string;
  customerPhone?: string;
  className?: string;
  showLabel?: boolean;
  variant?: "compact" | "full";
}

export default function PrintButton({
  order,
  customerName,
  customerPhone,
  className = "",
  showLabel = true,
  variant = "compact",
}: Props) {
  const ref = useRef<PrintReceiptHandle>(null);
  const [open, setOpen] = useState(false);

  const trigger = (kind: "receipt" | "kot" | "label") => {
    ref.current?.print(kind);
    setOpen(false);
  };

  if (variant === "full") {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full bg-[var(--color-surface-container-lowest)] border border-outline-variant text-on-surface rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-surface-container transition-all"
        >
          <span className="material-symbols-outlined">print</span>
          Print
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 bg-[var(--color-surface-container-lowest)] rounded-xl shadow-xl border border-outline-variant z-50 overflow-hidden print:hidden">
              <button onClick={() => trigger("receipt")} className="w-full text-left px-4 py-3 hover:bg-surface-container flex items-center gap-2 text-sm font-medium">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Customer Receipt
              </button>
              <button onClick={() => trigger("kot")} className="w-full text-left px-4 py-3 hover:bg-surface-container flex items-center gap-2 text-sm font-medium border-t border-outline-variant/30">
                <span className="material-symbols-outlined text-secondary">restaurant</span>
                Kitchen Ticket (KOT)
              </button>
              {showLabel && (
                <button onClick={() => trigger("label")} className="w-full text-left px-4 py-3 hover:bg-surface-container flex items-center gap-2 text-sm font-medium border-t border-outline-variant/30">
                  <span className="material-symbols-outlined text-tertiary">local_shipping</span>
                  Address Label
                </button>
              )}
            </div>
          </>
        )}
        <div className="hidden print:block">
          <PrintReceipt
            ref={ref}
            order={order}
            customerName={customerName}
            customerPhone={customerPhone}
            showKot
            showLabel={showLabel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => trigger("receipt")}
        className="bg-[var(--color-surface-container-lowest)] border border-outline-variant text-on-surface rounded-full w-10 h-10 flex items-center justify-center hover:bg-surface-container transition-all print:hidden"
        title="Print Receipt"
        aria-label="Print receipt"
      >
        <span className="material-symbols-outlined">print</span>
      </button>
      <div className="hidden print:block">
        <PrintReceipt
          ref={ref}
          order={order}
          customerName={customerName}
          customerPhone={customerPhone}
          showKot={false}
          showLabel={false}
        />
      </div>
    </div>
  );
}
