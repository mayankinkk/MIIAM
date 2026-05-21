import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Bookings — MIIAM",
  description: "View and manage your table reservations and service bookings. Cancel bookings or view restaurant details.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
