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

  const settingsSections = useMemo(
    () => [
      {
        title: t.settings.account,
        items: [
          {
            id: "profile",
            icon: "person",
            label: t.settings.editProfile,
            sub: t.settings.editProfileSub,
            href: "/app/profile/edit",
          },
          {
            id: "addresses",
            icon: "location_on",
            label: t.settings.savedAddresses,
            sub: t.settings.savedAddressesSub,
            href: "/app/addresses",
          },
          {
            id: "security",
            icon: "security",
            label: t.settings.security,
            sub: t.settings.securitySub,
            href: "/app/settings/security",
          },
        ],
      },
      {
        title: t.settings.preferences,
        items: [
          {
            id: "notifications",
            icon: "notifications",
            label: t.settings.notifications,
            sub: t.settings.notificationsSub,
            href: "/app/notifications",
          },
          {
            id: "language",
            icon: "language",
            label: t.settings.language,
            sub: t.settings.languageSub,
            href: "/app/settings/language",
          },
          {
            id: "theme",
            icon: "dark_mode",
            label: t.settings.theme,
            sub: t.settings.themeSub,
            href: "/app/settings/theme",
          },
        ],
      },
      {
        title: t.settings.support,
        items: [
          {
            id: "help",
            icon: "help",
            label: t.settings.helpCenter,
            sub: t.settings.helpCenterSub,
            href: "/app/support",
          },
          {
            id: "chat",
            icon: "chat",
            label: t.settings.chatWithUs,
            sub: t.settings.chatWithUsSub,
            href: "/app/support/chat",
          },
          {
            id: "legal",
            icon: "description",
            label: t.settings.legal,
            sub: t.settings.legalSub,
            href: "/app/settings/legal",
          },
        ],
      },
    ],
    [t]
  );

  const handleSignOut = async () => {
    if (
      !(await confirm({
        title: "Sign Out",
        message: "Are you sure you want to sign out?",
        variant: "danger",
      }))
    )
      return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen pb-24">
      <header className="bg-surface-container-lowest border-outline-variant/10 sticky top-0 z-10 border-b px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Link
            href="/app/profile"
            aria-label="Go back"
            className="bg-surface-container-high hover:bg-surface-container-highest flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </Link>
          <h1 className="text-on-surface text-xl font-black">{t.settings.title}</h1>
          <div className="w-10" />
        </div>
      </header>

      <Breadcrumbs
        items={[
          { label: t.common.home, href: "/app/home" },
          { label: t.profile.profileLabel, href: "/app/profile" },
          { label: t.settings.title },
        ]}
      />

      <main className="p-6">
        {settingsSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-on-surface-variant/70 mb-3 px-1 text-xs font-bold tracking-wider uppercase">
              {section.title}
            </h2>
            <div className="bg-surface-container-lowest border-outline-variant/10 overflow-hidden rounded-2xl border shadow-sm">
              {section.items.map((item, itemIndex) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`hover:bg-surface-container-high/50 active:bg-surface-container-high flex items-center gap-4 p-4 transition-colors ${
                    itemIndex !== section.items.length - 1
                      ? "border-outline-variant/10 border-b"
                      : ""
                  }`}
                >
                  <div className="bg-surface-container-high flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {item.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-on-surface font-bold">{item.label}</p>
                    <p className="text-on-surface-variant mt-0.5 truncate text-xs">{item.sub}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/40">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-surface-container-lowest border-outline-variant/10 mt-6 overflow-hidden rounded-2xl border shadow-sm">
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="hover:bg-error/10 active:bg-error/15 flex w-full items-center gap-4 p-4 transition-colors"
          >
            <div className="bg-error/10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl">
              <span className="material-symbols-outlined text-error">logout</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-error font-bold">
                {loading ? t.settings.signingOut : t.settings.signOut}
              </p>
              <p className="text-on-surface-variant mt-0.5 text-xs">{t.settings.signOutSub}</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant/40">
              chevron_right
            </span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant/60 text-xs">MIIAM v1.0.0</p>
          <p className="text-on-surface-variant/60 mt-1 text-xs">{t.profile.madeWithLove}</p>
        </div>
      </main>
    </div>
  );
}
