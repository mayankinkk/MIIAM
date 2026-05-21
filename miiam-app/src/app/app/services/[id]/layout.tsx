import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Details — MIIAM",
  description: "View service details, pricing, and inclusions. Select a date and time slot to book a professional service at your home.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
