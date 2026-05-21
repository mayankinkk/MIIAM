import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home Services — MIIAM",
  description: "Book professional home services including AC repair, cleaning, plumbing, electrical, beauty, pest control, and more at your doorstep.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
