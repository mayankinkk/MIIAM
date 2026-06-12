"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function OrdersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="Orders Error" />;
}
