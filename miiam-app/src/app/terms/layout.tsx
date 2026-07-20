import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — MIIAM",
  description:
    "Read the Terms of Service for using MIIAM — Guwahati's platform for food delivery, grocery, beauty, and home services.",
  openGraph: {
    title: "Terms of Service — MIIAM",
    description: "Terms of Service for using MIIAM in Guwahati.",
    url: "https://miiam.in/terms",
    siteName: "MIIAM",
    type: "website",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
