"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { confirm } = useConfirm();

  const settingsSections = useMemo(() => [
    {
      title: t.settings.account,
      items: [
        { id: "profile", icon: "person", label: t.settings.editProfile, sub: t.settings.editProfileSub, href: "/app/profile/edit" },
        { id: "addresses", icon: "location_on", label: t.settings.savedAddresses, sub: t.settings.savedAddressesSub, href: "/app/addresses" },
        { id: "security", icon: "security", label: t.settings.security, sub: t.settings.securitySub, href: "/app/settings/security" },
      ]
    },
    {
      title: t.settings.preferences,
      items: [
        { id: "notifications", icon: "notifications", label: t.settings.notifications, sub: t.settings.notificationsSub, href: "/app/notifications" },
        { id: "language", icon: "language", label: t.settings.language, sub: t.settings.languageSub, href: "/app/settings/language" },
        { id: "theme", icon: "dark_mode", label: t.settings.theme, sub: t.settings.themeSub, href: "/app/settings/theme" },
      ]
    },
    {
      title: t.settings.support,
      items: [
        { id: "help", icon: "help", label: t.settings.helpCenter, sub: t.settings.helpCenterSub, href: "/app/support" },
        { id: "chat", icon: "chat", label: t.settings.chatWithUs, sub: t.settings.chatWithUsSub, href: "/app/support/chat" },
        { id: "legal", icon: "description", label: t.settings.legal, sub: t.settings.legalSub, href: "/app/settings/legal" },
      ]
    },
  ], [t]);

  const handleSignOut = async () => {
    if (!await confirm({ title: "Sign Out", message: "Are you sure you want to sign out?", variant: "danger" })) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-[var(--color-surface)] text-on-background pb-24">
      <header className="bg-surface-container dark:bg-[var(--color-surface-container-lowest)] px-6 py-4 sticky top-0 z-10 border-b border-outline-variant/10 dark:border-[var(--color-border-subtle)] shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/app/profile" aria-label="Go back" className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-on-background">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-surface">{t.settings.title}</h1>
          <div className="w-10" />
        </div>
      </header>

      <Breadcrumbs items={[{ label: t.common.home, href: '/app/explore' }, { label: t.profile.profileLabel, href: '/app/profile' }, { label: t.settings.title }]} />

      <main className="p-6">
        {settingsSections.map((section, sectionIndex) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mb-3">{section.title}</h2>
            <div className="bg-surface-container dark:bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 dark:border-[var(--color-border-subtle)]">
              {section.items.map((item, itemIndex) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-4 p-4 hover:bg-surface-container-high transition-colors ${
                    itemIndex !== section.items.length - 1 ? "border-b border-outline-variant/10" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-on-surface">{item.label}</p>
                    <p className="text-xs text-on-surface-variant">{item.sub}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/50">chevron_right</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-surface-container dark:bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden shadow-sm mt-6 border border-outline-variant/10 dark:border-[var(--color-border-subtle)]">
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 hover:bg-red-500/10 transition-colors"
          >
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600">logout</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-red-600">{loading ? t.settings.signingOut : t.settings.signOut}</p>
              <p className="text-xs text-red-500/60">{t.settings.signOutSub}</p>
            </div>
            <span className="material-symbols-outlined text-red-400">chevron_right</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-on-surface-variant/60">MIIAM v1.0.0</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">{t.profile.madeWithLove}</p>
        </div>
      </main>
    </div>
  );
}
