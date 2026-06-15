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

      // Server-side session revocation
      await fetch("/api/auth/logout", { method: "POST" });

      // Client-side cookie cleanup
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-container-lowest)]">
      <div className="text-center">
        {isLoading ? (
          <span className="material-symbols-outlined text-6xl text-[var(--color-primary)] animate-spin">sync</span>
        ) : (
          <span className="material-symbols-outlined text-6xl text-green-500">check_circle</span>
        )}
        <p className="mt-4 text-[var(--color-on-surface-variant)] font-bold">{isLoading ? "Signing out..." : "Redirecting..."}</p>
      </div>
    </div>
  );
}
