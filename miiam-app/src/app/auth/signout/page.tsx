"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function SignOutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function signOut() {
      const supabase = createClient();
      await supabase.auth.signOut();
      setIsLoading(false);
    }
    signOut();
  }, [router]);

  useEffect(() => {
    if (!isLoading) {
      router.push("/auth/login");
      router.refresh();
    }
  }, [isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff4f4]">
      <div className="text-center">
        {isLoading ? (
          <span className="material-symbols-outlined text-6xl text-[#ba001c] animate-spin">sync</span>
        ) : (
          <span className="material-symbols-outlined text-6xl text-green-500">check_circle</span>
        )}
        <p className="mt-4 text-[#814c55] font-bold">{isLoading ? "Signing out..." : "Redirecting..."}</p>
      </div>
    </div>
  );
}