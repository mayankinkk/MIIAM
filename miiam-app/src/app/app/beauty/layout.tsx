import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beauty & Wellness — MIIAM",
  description: "Book salon, spa, makeup and nail care services at home",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
