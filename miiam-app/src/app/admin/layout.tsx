import type { Metadata } from "next";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "MIIAM Super-Admin Dashboard",
  description: "Global platform management.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fcf9f9] flex">
      <Suspense fallback={<div className="w-64 bg-white animate-pulse" />}>
        <AdminSidebar />
      </Suspense>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative">
        <AdminHeader />
        <div className="pt-24 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
