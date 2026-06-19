"use client";
import AdminPageError from "@/components/AdminPageError";
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminPageError error={error} reset={reset} title="Medicines Error" />;
}
