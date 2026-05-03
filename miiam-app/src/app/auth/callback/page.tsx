"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

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
            window.location.href = "/app/explore";
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
  }, [router, supabase]);

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