"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function ServiceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="Service Error" />;
}
