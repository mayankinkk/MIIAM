"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function SecurityPage() {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const handlePasswordReset = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-24">
      <header className="bg-surface-container border-outline-variant/10 sticky top-0 z-10 border-b px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/app/settings"
            className="bg-surface-container-high hover:bg-surface-container-highest flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-on-background">arrow_back</span>
          </Link>
          <h1 className="text-on-background text-xl font-black">{t.settings.security}</h1>
        </div>
      </header>

      <Breadcrumbs
        items={[
          { label: t.common.home, href: "/app/home" },
          { label: t.settings.title, href: "/app/settings" },
          { label: t.settings.security },
        ]}
      />

      <main className="space-y-4 p-6">
        {/* Change Password */}
        <div className="bg-surface-container border-outline-variant/10 rounded-2xl border p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-accent/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <span className="material-symbols-outlined text-accent">lock_reset</span>
            </div>
            <div>
              <p className="text-on-surface font-bold">{t.settings.securitySub}</p>
              <p className="text-on-surface-variant text-xs">
                A reset link will be sent to your email
              </p>
            </div>
          </div>
          {sent ? (
            <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-green-500">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span className="text-sm font-bold">Reset link sent! Check your inbox.</span>
            </div>
          ) : (
            <button
              onClick={handlePasswordReset}
              disabled={loading}
              className="bg-primary text-on-primary hover:bg-primary hover:text-on-primary/95 w-full rounded-xl py-3 font-bold transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Password Reset Email"}
            </button>
          )}
        </div>

        {/* Two-Factor Auth */}
        <div className="bg-surface-container border-outline-variant/10 rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <span className="material-symbols-outlined text-accent">phone_android</span>
              </div>
              <div>
                <p className="text-on-surface font-bold">{t.settings.securitySub}</p>
                <p className="text-on-surface-variant text-xs">Extra security for your account</p>
              </div>
            </div>
            <button
              onClick={() => setTwoFAEnabled(!twoFAEnabled)}
              className={`relative h-6 w-12 rounded-full transition-colors ${twoFAEnabled ? "bg-primary" : "bg-surface-container-high"}`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-all ${twoFAEnabled ? "left-7" : "left-1"}`}
              />
            </button>
          </div>
          {twoFAEnabled && (
            <div className="bg-surface-container-low border-outline-variant/20 text-on-surface-variant mt-3 rounded-xl border p-3">
              <p className="text-xs font-bold">
                Contact support to enable 2FA via authenticator app.
              </p>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <Link
          href="/app/settings/security/devices"
          className="bg-surface-container border-outline-variant/10 hover:bg-surface-container-high flex items-center gap-3 rounded-2xl border p-5 shadow-sm transition-colors"
        >
          <div className="bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-xl">
            <span className="material-symbols-outlined text-on-surface-variant">devices</span>
          </div>
          <div className="flex-1">
            <p className="text-on-surface font-bold">Devices &amp; Login Activity</p>
            <p className="text-on-surface-variant text-xs">
              Manage signed-in devices, see recent activity
            </p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </Link>
      </main>
    </div>
  );
}
