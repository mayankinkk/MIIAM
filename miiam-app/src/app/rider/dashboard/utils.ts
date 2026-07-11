import type { Order } from "./types";

export function calculatePeakEarnings(order: Order): number {
  const base = order.earnings;
  return base * (order.peakMultiplier || 1);
}

export function isPeakHour(): boolean {
  const hour = parseInt(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }),
    10,
  );
  return (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
}
