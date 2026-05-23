"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RiderNavBar from "@/components/rider/RiderNavBar";

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const isAuthPage = pathname === "/rider/login" || pathname === "/rider/apply";

  // Load dark mode setting and apply to document
  useEffect(() => {
    async function loadDarkMode() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rider } = await supabase.from("riders").select("id").eq("user_id", user.id).single();
      if (!rider) return;
      const { data: settings } = await supabase.from("rider_settings").select("dark_mode").eq("rider_id", rider.id).single();
      if (settings?.dark_mode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    loadDarkMode();
  }, [supabase]);

  useEffect(() => {
    if (isAuthPage) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/rider/login");
    });
  }, [isAuthPage, router, supabase]);

  return (
    <>
      {children}
      {!isAuthPage && <RiderNavBar />}
    </>
  );
}
