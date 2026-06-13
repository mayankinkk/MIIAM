"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const redirectTo = searchParams.get("redirect") || "/app/home";

    if (!code) {
      router.replace("/auth/login");
      return;
    }

    const supabase = createClient();

    supabase.auth.exchangeCodeForSession(code).then(async ({ error: exchangeError }) => {
      if (exchangeError) {
        console.error("OAuth exchange error:", exchangeError.message);
        setError(exchangeError.message);
        setTimeout(() => router.replace("/auth/login"), 3000);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_profile_complete")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.replace("/auth/profile-setup");
      } else if (profile.role === "admin") {
        router.replace("/admin");
      } else if (!profile.is_profile_complete) {
        router.replace("/auth/profile-setup");
      } else {
        router.replace(redirectTo);
      }
    });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff4f4]">
        <div className="text-center max-w-md p-8">
          <span className="material-symbols-outlined text-6xl text-red-500">error</span>
          <p className="mt-4 text-[#4d212a] font-medium">Sign-in failed</p>
          <p className="mt-2 text-sm text-[#5c403d]/60">{error}</p>
          <p className="mt-4 text-sm text-[#5c403d]/60">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff4f4]">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-[#ba001c] animate-spin">sync</span>
        <p className="mt-4 text-[#4d212a] font-medium">Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fff4f4]">
        <div className="w-8 h-8 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
