"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
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
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-600 transition-colors font-bold text-sm w-full"
    >
      <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
      Sign Out
    </button>
  );
}