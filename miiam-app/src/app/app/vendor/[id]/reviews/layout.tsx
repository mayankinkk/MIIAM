import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Reviews — MIIAM",
  description: "Read all customer reviews for this vendor. Filter by rating to see what others are saying about the food and service.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
