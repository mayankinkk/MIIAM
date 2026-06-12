"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function ServicesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="Services Error" />;
}
