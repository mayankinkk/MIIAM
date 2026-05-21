import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet — MIIAM",
  description: "View your MIIAM wallet balance, loyalty points, and transaction history. Add money or withdraw funds easily.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
