import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Food Delivery — MIIAM",
  description: "Order from the best restaurants near you",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
