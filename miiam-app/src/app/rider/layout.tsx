"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RiderNavBar from "@/components/rider/RiderNavBar";

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/rider/login" || pathname === "/rider/apply";

  useEffect(() => {
    if (isAuthPage) return;
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/rider/login");
    });
  }, [isAuthPage, router]);

  return (
    <>
      {children}
      {!isAuthPage && <RiderNavBar />}
    </>
  );
}
