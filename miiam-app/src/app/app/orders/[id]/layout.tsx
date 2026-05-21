import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Tracking — MIIAM",
  description: "Track your order in real-time with live map, rider location, and order journey updates.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
