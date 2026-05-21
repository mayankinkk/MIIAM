import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Favorites — MIIAM",
  description: "View all your saved restaurants and services. Quickly reorder from your favorite places.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
