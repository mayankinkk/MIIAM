import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fresh Groceries — MIIAM",
  description: "Order fresh fruits, vegetables, dairy and more delivered to your doorstep",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
