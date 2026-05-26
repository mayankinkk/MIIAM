import type { Order } from "./types";

export function calculatePeakEarnings(order: Order): number {
  const base = order.earnings;
  return base * (order.peakMultiplier || 1);
}

export function isPeakHour(): boolean {
  const hour = new Date().getHours();
  return (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
}
