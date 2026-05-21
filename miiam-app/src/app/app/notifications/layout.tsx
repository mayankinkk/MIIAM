import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications — MIIAM",
  description: "Manage your push notification preferences and view your notification history for orders, promotions, and updates.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
