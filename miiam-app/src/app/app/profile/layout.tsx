import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile — MIIAM",
  description: "View your profile, order stats, and access all account sections including orders, bookmarks, and settings.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
