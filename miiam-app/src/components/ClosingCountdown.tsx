"use client";

import { useState, useEffect } from "react";

function getClosingInfo(hours: string | null | undefined): { minutesLeft: number; isOpen: boolean } {
  if (!hours) return { minutesLeft: 0, isOpen: true };
  try {
    const to24 = (t: string) => {
      const [time, mod] = t.trim().split(" ");
      let [h, m] = time.split(":").map(Number);
      if (!m) m = 0;
      if (mod?.toUpperCase() === "PM" && h !== 12) h += 12;
      if (mod?.toUpperCase() === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };
    const parts = hours.replace("–", "-").split("-");
    if (parts.length < 2) return { minutesLeft: 0, isOpen: true };
    const open = to24(parts[0]);
    const close = to24(parts[1]);
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const isOpen = cur >= open && cur < close;
    return { minutesLeft: isOpen ? close - cur : 0, isOpen };
  } catch {
    return { minutesLeft: 0, isOpen: true };
  }
}

interface Props {
  openingHours: string | null | undefined;
}

export default function ClosingCountdown({ openingHours }: Props) {
  const [info, setInfo] = useState(() => getClosingInfo(openingHours));

  useEffect(() => {
    const interval = setInterval(() => {
      setInfo(getClosingInfo(openingHours));
    }, 30_000);
    return () => clearInterval(interval);
  }, [openingHours]);

  if (!info.isOpen || info.minutesLeft <= 0) return null;

  const hours = Math.floor(info.minutesLeft / 60);
  const mins = info.minutesLeft % 60;

  if (info.minutesLeft > 60) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Open · {hours > 0 ? `${hours}h ` : ""}{mins > 0 ? `${mins}m` : ""} left
      </span>
    );
  }

  if (info.minutesLeft <= 30) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Closing in {mins}m
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Closing in {mins}m
    </span>
  );
}
