import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Addresses — MIIAM",
  description: "Manage your saved delivery addresses. Add, edit, delete, or set a default address for faster checkout.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
