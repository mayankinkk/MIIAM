"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function CartError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="Cart Error" />;
}
