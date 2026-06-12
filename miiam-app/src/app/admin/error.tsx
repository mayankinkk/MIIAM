"use client";
import ErrorBoundary from "@/components/ErrorBoundary";
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} title="Admin Panel Error" icon="admin_panel_settings" />;
}
