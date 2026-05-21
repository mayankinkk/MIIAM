import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Settings — MIIAM",
  description: "Manage your password, enable two-factor authentication, and review active sessions for account security.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
