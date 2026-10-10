"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      title={collapsed ? "Sign Out" : undefined}
      className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-4"} text-on-surface-variant w-full rounded-xl py-3 text-sm font-bold transition-colors hover:text-red-600`}
    >
      <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
      {!collapsed && "Sign Out"}
    </button>
  );
}
