"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function RiderError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="Rider Dashboard Error" icon="motorcycle" />;
}
