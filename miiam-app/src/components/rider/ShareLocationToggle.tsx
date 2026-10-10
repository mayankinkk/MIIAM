"use client";

import { useState } from "react";
import { useShareLocation } from "@/lib/hooks/useShareLocation";

interface Props {
  orderId: string;
  userId: string;
  /** Order is in a shareable state (rider assigned, not delivered) */
  enabled: boolean;
  className?: string;
}

export default function ShareLocationToggle({ orderId, userId, enabled, className = "" }: Props) {
  const { sharing, error, lastSent, start, stop } = useShareLocation({
    orderId,
    userId,
    active: enabled,
  });
  const [busy, setBusy] = useState(false);

  if (!enabled) return null;

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (sharing) {
        await stop();
      } else {
        await start();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        aria-pressed={sharing}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-bold transition-all ${
          sharing
            ? "bg-tertiary text-on-tertiary border-tertiary-dim shadow-tertiary/20 shadow-lg"
            : "text-on-surface border-outline-variant hover:bg-surface-container bg-[var(--color-surface-container-lowest)]"
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          {sharing ? "location_on" : "share_location"}
        </span>
        {sharing ? "Sharing Live Location" : "Share Live Location"}
        {sharing && (
          <span className="bg-tertiary-dim h-2 w-2 animate-pulse rounded-full" aria-hidden="true" />
        )}
      </button>
      {sharing && lastSent && (
        <p className="text-on-surface-variant mt-2 flex items-center justify-center gap-1 text-center text-[11px]">
          <span className="material-symbols-outlined text-xs">check_circle</span>
          Rider can see your live location · last updated{" "}
          {new Date(lastSent.updatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      )}
      {error && (
        <p className="text-error mt-2 flex items-center justify-center gap-1 text-center text-[11px]">
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
