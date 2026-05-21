import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Chat — MIIAM",
  description: "Chat with MIIAM customer support for immediate help with orders, payments, refunds, and other issues.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
