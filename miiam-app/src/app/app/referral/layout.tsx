import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refer & Earn — MIIAM",
  description: "Share your referral code with friends and earn rewards for every successful referral. Track your earnings and referrals.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
