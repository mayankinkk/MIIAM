import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rate & Review — MIIAM",
  description: "Rate your order, review the food and delivery service, and share your feedback with the restaurant and rider.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
