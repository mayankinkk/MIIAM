import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat with Rider — MIIAM",
  description: "Chat directly with your delivery rider for real-time updates, directions, and coordination.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
