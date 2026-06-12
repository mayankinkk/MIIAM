"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function RestaurantError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="Restaurant Error" />;
}
