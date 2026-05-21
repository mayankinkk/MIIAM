import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Profile — MIIAM",
  description: "Update your profile photo, full name, and phone number to keep your account information current.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
