"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectTo = searchParams.get("redirect") || "/app/home";
    const supabase = createClient();

    async function handlePostAuth(userId: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_profile_complete")
        .eq("id", userId)
        .single();

      const profileSetupUrl = `/auth/profile-setup?redirect=${encodeURIComponent(redirectTo)}`;

      if (!profile) {
        router.replace(profileSetupUrl);
      } else if (profile.role === "admin") {
        router.replace("/admin");
      } else if (!profile.is_profile_complete) {
        router.replace(profileSetupUrl);
      } else {
        router.replace(redirectTo);
      }
    }

    async function handleAuth() {
      // Check if session already exists (auto-exchanged by createBrowserClient init)
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (existingSession?.user) {
        await handlePostAuth(existingSession.user.id);
        return;
      }

      // No session yet, try explicit exchange
      const code = searchParams.get("code");
      if (!code) {
        router.replace("/auth/login");
        return;
      }

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        // Code might have been consumed by auto-exchange race condition
        // Check one more time if session was established
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession?.user) {
          await handlePostAuth(retrySession.user.id);
          return;
        }
        console.error("OAuth exchange error:", exchangeError.message);
        setError(exchangeError.message);
        setTimeout(() => router.replace("/auth/login"), 3000);
        return;
      }

      if (data.session?.user) {
        await handlePostAuth(data.session.user.id);
      } else {
        router.replace("/auth/login");
      }
    }

    handleAuth();
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
