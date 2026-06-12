"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function PaymentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="Payment Error" />;
}
