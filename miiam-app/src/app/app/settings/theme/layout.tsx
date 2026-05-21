import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Theme Settings — MIIAM",
  description: "Customize the app appearance with light, dark, or system theme. Preview changes before applying.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
