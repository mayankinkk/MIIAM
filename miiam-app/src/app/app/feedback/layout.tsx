import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback — MIIAM",
  description: "Rate and review your service experience. Share feedback on service quality, professionalism, and overall satisfaction.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
