import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Address — MIIAM",
  description: "Add a new delivery address using the interactive map, search for locations, or auto-detect your current location.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
