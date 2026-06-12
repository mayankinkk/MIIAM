"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function ProfileError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="Profile Error" />;
}
