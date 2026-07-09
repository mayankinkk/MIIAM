import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — MIIAM",
  description:
    "Read the Privacy Policy for MIIAM — how we collect, use, and protect your data under DPDPA 2023.",
  openGraph: {
    title: "Privacy Policy — MIIAM",
    description: "Privacy Policy for MIIAM under DPDPA 2023.",
    url: "https://miiam.in/privacy",
    siteName: "MIIAM",
    type: "website",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
