import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MIIAM+ Subscription — MIIAM",
  description: "Choose a membership plan — MIIAM Pro or Gold — to unlock free delivery, exclusive deals, bonus loyalty points, and more benefits.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
