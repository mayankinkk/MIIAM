import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — MIIAM",
  description: "Manage your account settings, preferences, notifications, and app configuration all in one place.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
