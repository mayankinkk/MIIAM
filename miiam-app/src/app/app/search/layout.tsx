import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search — MIIAM",
  description: "Search restaurants, dishes, cuisines, and menu items. Filter by veg or non-veg to find exactly what you're craving.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
