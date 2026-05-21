import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Language Settings — MIIAM",
  description: "Choose your preferred app language. Switch between English and Hindi to personalize your experience.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
