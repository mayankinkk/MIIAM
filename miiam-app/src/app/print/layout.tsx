import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://miiam.app";

export const metadata: Metadata = {
  title: "Print & Deliver in 30 Minutes · MIIAM Print Store",
  description:
    "Upload your documents, customize settings, and get them printed and delivered to your door. From ₹2 per B&W page. Passport photos, color prints, binding & lamination available.",
  keywords: [
    "online printing",
    "document printing",
    "passport photos",
    "same day print delivery",
    "color print",
    "print and deliver",
    "MIIAM",
  ],
  openGraph: {
    title: "MIIAM Print Store — Print & Deliver in 30 Minutes",
    description:
      "Documents, passport photos, presentations. Upload, customize, deliver. From ₹2 per B&W page.",
    type: "website",
    url: `${SITE_URL}/print`,
  },
  twitter: {
    card: "summary_large_image",
    title: "MIIAM Print Store — Print & Deliver in 30 Minutes",
    description: "From ₹2 per page · 30-minute delivery · No minimum",
  },
  alternates: {
    canonical: `${SITE_URL}/print`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
