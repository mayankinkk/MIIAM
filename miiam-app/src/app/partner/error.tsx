"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function PartnerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="Partner Dashboard Error" icon="business" />;
}
