import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — MIIAM",
  description:
    "Learn about MIIAM — Guwahati's hyper-local platform for food delivery, grocery, beauty, and home services. Community-first, Assam-grown.",
  openGraph: {
    title: "About MIIAM",
    description:
      "Guwahati's hyper-local platform for food delivery, grocery, beauty, and home services.",
    url: "https://miiam.in/about",
    siteName: "MIIAM",
    type: "website",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
