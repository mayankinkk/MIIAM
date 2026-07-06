"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import logger from "@/lib/logger";

export function AnalyticsTracker() {
  usePageTracking();
  useAutoFlush();
  return null;
}

export type FunnelEvent =
  | "page_view"
  | "vendor_view"
  | "menu_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "cart_view"
  | "checkout_start"
  | "payment_start"
  | "payment_success"
  | "payment_failure"
  | "order_placed"
  | "order_delivered"
  | "promo_applied"
  | "search"
  | "filter_applied";

export interface FunnelEventData {
  event: FunnelEvent;
  properties?: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
  userId?: string;
}

const SESSION_KEY = "miiam_analytics_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function getUserId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("miiam_user_id") || undefined;
}

const eventBuffer: FunnelEventData[] = [];
const FLUSH_INTERVAL = 5000;
const MAX_BUFFER_SIZE = 50;

let flushTimer: ReturnType<typeof setInterval> | null = null;

function flushEvents(): void {
  if (eventBuffer.length === 0) return;

  const events = [...eventBuffer];
  eventBuffer.length = 0;

  try {
    const stored = JSON.parse(localStorage.getItem("miiam_funnel_events") || "[]");
    const allEvents = [...stored, ...events].slice(-500);
    localStorage.setItem("miiam_funnel_events", JSON.stringify(allEvents));
  } catch {
    // silently fail
  }
}

function startFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(flushEvents, FLUSH_INTERVAL);
}

export function trackFunnelEvent(event: FunnelEvent, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  const eventData: FunnelEventData = {
    event,
    properties,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    userId: getUserId(),
  };

  eventBuffer.push(eventData);

  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    flushEvents();
  } else {
    startFlushTimer();
  }
}

export function usePageTracking(): void {
  const pathname = usePathname();

  useEffect(() => {
    trackFunnelEvent("page_view", { path: pathname });
  }, [pathname]);
}

export function useVendorView(vendorId: string, vendorName: string): void {
  useEffect(() => {
    trackFunnelEvent("vendor_view", { vendorId, vendorName });
  }, [vendorId, vendorName]);
}

export function trackAddToCart(menuItemId: string, vendorId: string, price: number, quantity: number): void {
  trackFunnelEvent("add_to_cart", { menuItemId, vendorId, price, quantity, value: price * quantity });
}

export function trackRemoveFromCart(menuItemId: string, vendorId: string): void {
  trackFunnelEvent("remove_from_cart", { menuItemId, vendorId });
}

export function trackCheckoutStart(subtotal: number, itemCount: number, vendorIds: string[]): void {
  trackFunnelEvent("checkout_start", { subtotal, itemCount, vendorIds });
}

export function trackPaymentStart(method: string, amount: number): void {
  trackFunnelEvent("payment_start", { method, amount });
}

export function trackPaymentSuccess(method: string, amount: number, orderId?: string): void {
  trackFunnelEvent("payment_success", { method, amount, orderId });
}

export function trackPaymentFailure(method: string, amount: number, error?: string): void {
  trackFunnelEvent("payment_failure", { method, amount, error });
}

export function trackOrderPlaced(orderId: string, totalAmount: number, vendorIds: string[], itemIds: string[]): void {
  trackFunnelEvent("order_placed", { orderId, totalAmount, vendorIds, itemIds, itemCount: itemIds.length });
}

export function trackOrderDelivered(orderId: string, deliveryTimeMinutes: number): void {
  trackFunnelEvent("order_delivered", { orderId, deliveryTimeMinutes });
}

export function trackPromoApplied(code: string, discount: number): void {
  trackFunnelEvent("promo_applied", { code, discount });
}

export function trackSearch(query: string, resultCount: number): void {
  trackFunnelEvent("search", { query, resultCount });
}

export function getFunnelEvents(): FunnelEventData[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("miiam_funnel_events") || "[]");
  } catch {
    return [];
  }
}

export function getConversionRate(
  events: FunnelEventData[],
  fromEvent: FunnelEvent,
  toEvent: FunnelEvent,
): number {
  const fromCount = events.filter(e => e.event === fromEvent).length;
  const toCount = events.filter(e => e.event === toEvent).length;
  if (fromCount === 0) return 0;
  return +((toCount / fromCount) * 100).toFixed(1);
}

export function useAutoFlush(): void {
  useEffect(() => {
    startFlushTimer();
    return () => {
      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }
      flushEvents();
    };
  }, []);
}
