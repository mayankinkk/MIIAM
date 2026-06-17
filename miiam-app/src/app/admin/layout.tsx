import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "MIIAM Super-Admin Dashboard",
  description: "Global platform management.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)] flex">
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
