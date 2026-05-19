"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SecurityPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const handlePasswordReset = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] dark:bg-slate-950 pb-24">
      <header className="bg-white dark:bg-slate-900 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/app/settings" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a] dark:text-white">Security</h1>
        </div>
      </header>

      <main className="p-6 space-y-4">
        {/* Change Password */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">lock_reset</span>
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Change Password</p>
              <p className="text-xs text-slate-500">A reset link will be sent to your email</p>
            </div>
          </div>
          {sent ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span className="text-sm font-bold">Reset link sent! Check your inbox.</span>
            </div>
          ) : (
            <button
              onClick={handlePasswordReset}
              disabled={loading}
              className="w-full py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:bg-[#a00018] disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? "Sending..." : "Send Password Reset Email"}
            </button>
          )}
        </div>

        {/* Two-Factor Auth */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-600">phone_android</span>
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Two-Factor Auth</p>
                <p className="text-xs text-slate-500">Extra security for your account</p>
              </div>
            </div>
            <button
              onClick={() => setTwoFAEnabled(!twoFAEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${twoFAEnabled ? "bg-[#ba001c]" : "bg-slate-200"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${twoFAEnabled ? "left-7" : "left-1"}`} />
            </button>
          </div>
          {twoFAEnabled && (
            <div className="mt-3 bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-amber-700 font-bold">2FA setup via authenticator app coming soon.</p>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-600">devices</span>
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">This Device</p>
              <p className="text-xs text-slate-500">Current session · Active now</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold">Session is secure</span>
          </div>
        </div>
      </main>
    </div>
  );
}
