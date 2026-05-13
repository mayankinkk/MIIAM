"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type EventParams = Record<string, string | number | boolean | undefined>;

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export function trackEvent(
  eventName: string,
  params?: EventParams
) {
  if (typeof window === "undefined") return;
  
  const gtag = (window as any).gtag;
  if (gtag) {
    gtag("event", eventName, params);
  } else {
    console.log("[Analytics]", eventName, params);
  }
}

export function trackPageView(url: string, title?: string) {
  if (typeof window === "undefined") return;
  
  const gtag = (window as any).gtag;
  if (GA_MEASUREMENT_ID && gtag) {
    gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title,
    });
  } else {
    console.log("[Analytics] Page view:", url, title);
  }
}

export function trackOrderEvent(
  eventName: string,
  orderId: string,
  amount?: number,
  currency: string = "INR"
) {
  trackEvent(eventName, {
    order_id: orderId,
    value: amount,
    currency,
  });
}

export function trackAddToCart(
  itemId: string,
  itemName: string,
  price: number,
  quantity: number = 1,
  category?: string
) {
  trackEvent("add_to_cart", {
    items: [
      {
        item_id: itemId,
        item_name: itemName,
        price,
        quantity,
        item_category: category,
      },
    ],
    value: price * quantity,
    currency: "INR",
  });
}

export function trackPurchase(
  transactionId: string,
  value: number,
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>
) {
  trackEvent("purchase", {
    transaction_id: transactionId,
    value,
    currency: "INR",
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

export function trackSearch(searchTerm: string, resultsCount?: number) {
  trackEvent("search", {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

export function trackSignUp(method: string) {
  trackEvent("sign_up", {
    method,
  });
}

export function trackLogin(method: string) {
  trackEvent("login", {
    method,
  });
}

export function trackShare(
  contentType: string,
  itemId: string,
  method: string
) {
  trackEvent("share", {
    content_type: contentType,
    item_id: itemId,
    method,
  });
}

function AnalyticsTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (GA_MEASUREMENT_ID) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      (window as any).gtag = gtag;
      gtag("js", new Date());
      gtag("config", GA_MEASUREMENT_ID);
    }
  }, []);

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
      trackPageView(url, document.title);
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerInner />
    </Suspense>
  );
}