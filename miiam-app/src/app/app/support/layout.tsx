import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support — MIIAM",
  description: "Get 24/7 support via live chat, phone, email, or WhatsApp. Browse FAQs and manage support tickets for order issues.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
