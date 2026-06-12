"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function PrintingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="Printing Error" />;
}
