import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers — MIIAM",
  description:
    "Join MIIAM as a delivery rider in Gauripur, Dhubri. Flexible hours, 100% tips, weekly payouts, and growth opportunities. Apply now!",
  openGraph: {
    title: "Careers at MIIAM",
    description:
      "Join MIIAM as a delivery rider in Gauripur, Dhubri. Flexible hours, 100% tips, weekly payouts.",
    url: "https://miiam.in/careers",
    siteName: "MIIAM",
    type: "website",
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
