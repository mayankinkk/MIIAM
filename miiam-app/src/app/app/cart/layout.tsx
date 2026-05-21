import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Cart — MIIAM",
  description: "Review and checkout your orders",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
