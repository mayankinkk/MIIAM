import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders — MIIAM",
  description: "Track and manage all your orders in one place. View order history, reorder favorites, and check delivery status.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
