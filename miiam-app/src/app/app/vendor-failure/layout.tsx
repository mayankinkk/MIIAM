import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendor Unavailable — MIIAM",
  description: "Your order could not be fulfilled. Choose from refund options, reorder from another restaurant, or get MIIAM credit with bonus value.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
