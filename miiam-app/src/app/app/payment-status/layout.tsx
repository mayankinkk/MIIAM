import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Status — MIIAM",
  description: "View the status of your payment. See real-time progress, success confirmation, or retry options for failed payments.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
