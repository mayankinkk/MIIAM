import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal — MIIAM",
  description: "Review MIIAM's Terms of Service, Privacy Policy, Refund Policy, Cookie Policy, and contact the Grievance Officer.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
