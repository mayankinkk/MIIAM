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
      className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-4"} py-3 rounded-xl text-on-surface-variant hover:text-red-600 transition-colors font-bold text-sm w-full`}
    >
      <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
      {!collapsed && "Sign Out"}
    </button>
  );
}
