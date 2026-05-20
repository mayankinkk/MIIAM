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
    <div className="min-h-screen bg-background text-on-background pb-24">
      <header className="bg-surface-container px-6 py-4 sticky top-0 z-10 shadow-sm border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <Link href="/app/settings" className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-on-background">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-background">Security</h1>
        </div>
      </header>

      <main className="p-6 space-y-4">
        {/* Change Password */}
        <div className="bg-surface-container border border-outline-variant/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500">lock_reset</span>
            </div>
            <div>
              <p className="font-bold text-on-surface">Change Password</p>
              <p className="text-xs text-on-surface-variant">A reset link will be sent to your email</p>
            </div>
          </div>
          {sent ? (
            <div className="flex items-center gap-2 text-green-500 bg-green-500/10 rounded-xl px-4 py-3 border border-green-500/20">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span className="text-sm font-bold">Reset link sent! Check your inbox.</span>
            </div>
          ) : (
            <button
              onClick={handlePasswordReset}
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/95 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? "Sending..." : "Send Password Reset Email"}
            </button>
          )}
        </div>

        {/* Two-Factor Auth */}
        <div className="bg-surface-container border border-outline-variant/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-500">phone_android</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">Two-Factor Auth</p>
                <p className="text-xs text-on-surface-variant">Extra security for your account</p>
              </div>
            </div>
            <button
              onClick={() => setTwoFAEnabled(!twoFAEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${twoFAEnabled ? "bg-primary" : "bg-surface-container-high"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${twoFAEnabled ? "left-7" : "left-1"}`} />
            </button>
          </div>
          {twoFAEnabled && (
            <div className="mt-3 bg-surface-container-low border border-outline-variant/20 rounded-xl p-3 text-on-surface-variant">
              <p className="text-xs font-bold">2FA setup via authenticator app coming soon.</p>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="bg-surface-container border border-outline-variant/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">devices</span>
            </div>
            <div>
              <p className="font-bold text-on-surface">This Device</p>
              <p className="text-xs text-on-surface-variant">Current session · Active now</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold">Session is secure</span>
          </div>
        </div>
      </main>
    </div>
  );
}
