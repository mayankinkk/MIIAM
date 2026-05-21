import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flower Delivery — MIIAM",
  description: "Send beautiful bouquets and flower arrangements for every occasion",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
