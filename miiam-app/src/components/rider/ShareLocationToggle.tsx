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
  const { sharing, error, lastSent, start, stop } = useShareLocation({ orderId, userId, active: enabled });
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
        className={`w-full rounded-xl py-3 px-4 font-bold flex items-center justify-center gap-2 transition-all border ${
          sharing
            ? "bg-tertiary text-on-tertiary border-tertiary-dim shadow-lg shadow-tertiary/20"
            : "bg-white text-on-surface border-outline-variant hover:bg-surface-container"
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          {sharing ? "location_on" : "share_location"}
        </span>
        {sharing ? "Sharing Live Location" : "Share Live Location"}
        {sharing && (
          <span className="w-2 h-2 bg-tertiary-dim rounded-full animate-pulse" aria-hidden="true" />
        )}
      </button>
      {sharing && lastSent && (
        <p className="text-[11px] text-on-surface-variant text-center mt-2 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-xs">check_circle</span>
          Rider can see your live location · last updated{" "}
          {new Date(lastSent.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      )}
      {error && (
        <p className="text-[11px] text-error text-center mt-2 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
