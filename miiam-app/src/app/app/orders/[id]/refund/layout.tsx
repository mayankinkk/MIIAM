import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation — MIIAM",
  description: "Request a cancellation or refund for your order. Track the refund timeline from request to completion.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
