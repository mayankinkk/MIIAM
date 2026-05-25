"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const redirectTo = searchParams?.get("redirect") || "/app/explore";

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          router.push("/auth/login");
          return;
        }

        if (session?.user) {
          const user = session.user;
          
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("role, is_profile_complete")
            .eq("id", user.id)
            .single();

          if (!existingProfile) {
            await supabase.from("profiles").insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              role: "user",
              is_profile_complete: false,
            });
            router.push("/auth/profile-setup");
            return;
          }

          if (existingProfile?.role === "admin") {
            window.location.href = "/admin";
          } else if (!existingProfile?.is_profile_complete) {
            window.location.href = "/auth/profile-setup";
          } else {
            window.location.href = redirectTo;
          }
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    }

    handleCallback();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff4f4]">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-[#ba001c] animate-spin">sync</span>
          <p className="mt-4 text-[#4d212a] font-medium">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fff4f4]"><div className="w-8 h-8 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" /></div>}>
      <CallbackContent />
    </Suspense>
  );
}