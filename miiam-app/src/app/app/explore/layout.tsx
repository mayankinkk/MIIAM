import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore — MIIAM",
  description:
    "Discover food delivery, grocery, pharmacy, beauty, and home services near you in Guwahati. Order now on MIIAM!",
  openGraph: {
    title: "Explore MIIAM",
    description:
      "Food delivery, grocery, pharmacy, beauty, and home services in Guwahati.",
    url: "https://miiam.in/app/explore",
    siteName: "MIIAM",
    type: "website",
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
