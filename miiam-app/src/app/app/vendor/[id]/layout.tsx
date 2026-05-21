import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restaurant Menu — MIIAM",
  description: "Browse the full menu, read customer reviews, and add items to your cart from your favorite restaurant or vendor.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
