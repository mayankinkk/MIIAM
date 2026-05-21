import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Pharmacy — MIIAM",
  description: "Order medicines, wellness products and healthcare essentials online",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
