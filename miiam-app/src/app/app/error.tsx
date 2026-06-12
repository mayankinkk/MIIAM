"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="App Error" />;
}
