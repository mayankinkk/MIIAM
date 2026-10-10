"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";
import { useHapticStore } from "@/components/HapticFeedback";
import { useTranslation } from "@/lib/i18n/useTranslation";
import logger from "@/lib/logger";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import ThemeToggle from "@/components/ThemeToggle";
import { ProfileSkeleton } from "@/components/Skeleton";

export default function EnhancedProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ orders: 0, reviews: 0, saved: 0 });
  const [loading, setLoading] = useState(true);
  const [showHapticSettings, setShowHapticSettings] = useState(false);
  const { settings, updateSetting, triggerHaptic } = useHapticStore();

  const menuItems = [
    {
      id: "orders",
      icon: "receipt_long",
      label: t.profile.myOrders,
      sub: t.profile.viewAllOrders,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      id: "bookings",
      icon: "calendar_month",
      label: t.profile.bookings,
      sub: t.profile.serviceAppointments,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      id: "subscriptions",
      icon: "repeat",
      label: t.profile.recurringOrders,
      sub: t.profile.scheduledSubscriptions,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      id: "addresses",
      icon: "location_on",
      label: t.profile.savedAddresses,
      sub: t.profile.manageDeliveryAddresses,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      id: "favorites",
      icon: "favorite",
      label: t.profile.favorites,
      sub: t.profile.yourSavedItems,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      id: "payment",
      icon: "payment",
      label: t.profile.paymentMethods,
      sub: t.profile.cardsUpiWallets,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      id: "support",
      icon: "support_agent",
      label: t.profile.helpSupport,
      sub: t.profile.twentyFourSevenSupport,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      id: "settings",
      icon: "settings",
      label: t.profile.settings,
      sub: t.profile.appPreferences,
      color: "text-[var(--color-outline)]",
      bg: "bg-[var(--color-surface-subtle)]",
    },
    {
      id: "haptic",
      icon: "vibration",
      label: t.profile.hapticFeedback,
      sub: t.profile.vibrationSettings,
      color: "text-cyan-500",
      bg: "bg-cyan-50",
      special: true,
    },
  ];

  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setProfile(profileData);

          const { count: orderCount } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);
          const { count: reviewCount } = await supabase
            .from("reviews")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);
          const { count: favCount } = await supabase
            .from("favorites")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          setStats({
            orders: orderCount || 0,
            reviews: reviewCount || 0,
            saved: favCount || 0,
          });
        }
      } catch (err) {
        logger.error({ err }, "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadUserAndProfile();
  }, [supabase]);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="bg-surface min-h-screen pb-24 dark:bg-[var(--color-surface)]">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-surface flex min-h-screen flex-col pb-24 dark:bg-[var(--color-surface)]">
        <header className="from-primary to-primary-container text-on-primary rounded-b-[3rem] bg-gradient-to-br p-6 pb-12">
          <h1 className="text-xl font-black">{t.profile.title}</h1>
        </header>
        <main className="-mt-6 flex flex-1 items-center justify-center px-6">
          <div className="max-w-sm space-y-5 text-center">
            <div className="bg-primary/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
              <span className="material-symbols-outlined text-accent text-4xl">person</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-[var(--color-on-surface)]">
                You're browsing as a guest
              </h2>
              <p className="text-sm text-[var(--color-on-surface)]/70">
                Orders placed from this device show up under My Orders. Saved addresses stay on this
                device too.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/app/orders"
                className="text-on-primary block w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-center text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
              >
                My Orders
              </Link>
              <Link
                href="/app/home"
                className="block w-full rounded-xl border border-[var(--color-outline-variant)] py-3.5 text-center text-sm font-bold text-[var(--color-on-surface)] transition-colors hover:bg-[var(--color-surface-container)]"
              >
                Start Ordering
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pb-24 dark:bg-[var(--color-surface)]">
      {/* Header */}
      <header className="from-primary to-primary-container text-on-primary rounded-b-[3rem] bg-gradient-to-br p-6 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-black">{t.profile.title}</h1>
          <Link
            href="/app/profile/edit"
            aria-label="Edit profile"
            className="rounded-full bg-[var(--color-surface-container-lowest)]/10 p-2 transition-colors hover:bg-[var(--color-surface-container-lowest)]/20"
          >
            <span className="material-symbols-outlined">edit</span>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white/30 bg-[var(--color-surface-container-lowest)]/20 text-3xl font-black">
            {profile?.avatar_url ? (
              <BlurImage
                src={profile.avatar_url}
                alt="Avatar"
                fill
                className="h-full w-full"
                sizes="80px"
              />
            ) : (
              user?.email?.[0]?.toUpperCase() || "U"
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black">{displayName}</h2>
            <p className="text-sm text-white/80">{user?.email}</p>
            {profile?.phone && <p className="text-sm text-white/60">{profile.phone}</p>}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-[var(--color-surface-container-lowest)]/10 p-3 text-center">
            <p className="text-2xl font-black">{stats.orders}</p>
            <p className="text-[10px] tracking-wider text-white/70 uppercase">{t.profile.orders}</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface-container-lowest)]/10 p-3 text-center">
            <p className="text-2xl font-black">{stats.reviews}</p>
            <p className="text-[10px] tracking-wider text-white/70 uppercase">
              {t.profile.reviews}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface-container-lowest)]/10 p-3 text-center">
            <p className="text-2xl font-black">{stats.saved}</p>
            <p className="text-[10px] tracking-wider text-white/70 uppercase">{t.profile.saved}</p>
          </div>
        </div>
      </header>

      <Breadcrumbs
        items={[{ label: t.profile.home, href: "/app/home" }, { label: t.profile.profileLabel }]}
      />

      {/* Menu Items */}
      <main className="-mt-6 space-y-4 px-6">
        {/* Menu Sections */}
        <div className="space-y-2">
          {menuItems.slice(0, 4).map((item) => (
            <Link
              key={item.id}
              href={`/app/${item.id}`}
              className="block flex items-center gap-4 rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 transition-shadow hover:shadow-md dark:bg-[var(--color-surface-container)]"
            >
              <div className={`h-12 w-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[var(--color-on-surface)] dark:text-[var(--color-on-surface)]">
                  {item.label}
                </p>
                <p className="text-xs text-[var(--color-outline)] dark:text-[var(--color-outline)]">
                  {item.sub}
                </p>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]/60">
                chevron_right
              </span>
            </Link>
          ))}
        </div>

        {/* Second Section */}
        <div className="space-y-2">
          {menuItems.slice(4, 5).map((item) => (
            <Link
              key={item.id}
              href={`/app/${item.id}`}
              className="block flex items-center gap-4 rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 transition-shadow hover:shadow-md dark:bg-[var(--color-surface-container)]"
            >
              <div className={`h-12 w-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[var(--color-on-surface)]">{item.label}</p>
                <p className="text-xs text-[var(--color-outline)]">{item.sub}</p>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]/60">
                chevron_right
              </span>
            </Link>
          ))}
        </div>

        {/* Settings Section */}
        <div className="space-y-3">
          {/* Theme Toggle */}
          <div className="bg-surface-container-lowest rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="bg-surface-container flex h-12 w-12 items-center justify-center rounded-xl">
                <span className="material-symbols-outlined text-on-surface-variant">palette</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[var(--color-on-surface)]">Appearance</p>
                <p className="text-xs text-[var(--color-outline)]">Light, Dark, or System</p>
              </div>
            </div>
            <div className="mt-3 ml-16">
              <ThemeToggle />
            </div>
          </div>

          {menuItems.slice(5).map((item) =>
            item.special ? (
              <button
                key={item.id}
                onClick={() => {
                  triggerHaptic("medium");
                  setShowHapticSettings(!showHapticSettings);
                }}
                className="flex w-full items-center gap-4 rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 transition-shadow hover:shadow-md dark:bg-[var(--color-surface-container)]"
              >
                <div className={`h-12 w-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-[var(--color-on-surface)]">{item.label}</p>
                  <p className="text-xs text-[var(--color-outline)]">{item.sub}</p>
                </div>
                <span
                  className={`material-symbols-outlined text-[var(--color-outline-variant)]/60 transition-transform ${showHapticSettings ? "rotate-180" : ""}`}
                >
                  expand_more
                </span>
              </button>
            ) : (
              <Link
                key={item.id}
                href={`/app/${item.id}`}
                className="block flex items-center gap-4 rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 transition-shadow hover:shadow-md dark:bg-[var(--color-surface-container)]"
              >
                <div className={`h-12 w-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[var(--color-on-surface)]">{item.label}</p>
                  <p className="text-xs text-[var(--color-outline)]">{item.sub}</p>
                </div>
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]/60">
                  chevron_right
                </span>
              </Link>
            )
          )}
        </div>

        {/* Haptic Feedback Settings Panel */}
        {showHapticSettings && (
          <div className="animate-fade-in space-y-2 rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 dark:bg-[var(--color-surface-container)]">
            <div className="mb-4 flex items-center gap-3 border-b border-[var(--color-border-subtle)] pb-3">
              <span className="material-symbols-outlined text-accent">vibration</span>
              <p className="font-bold text-[var(--color-on-surface)]">
                {t.profile.hapticFeedbackSettings}
              </p>
            </div>

            <button
              onClick={() => updateSetting("enabled", !settings.enabled)}
              className="flex w-full items-center justify-between rounded-xl px-2 py-3 transition-colors hover:bg-[var(--color-surface-subtle)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50">
                  <span className="material-symbols-outlined text-cyan-500">
                    power_settings_new
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[var(--color-on-surface)]">
                    {t.profile.enableHaptics}
                  </p>
                  <p className="text-xs text-[var(--color-outline)]">{t.profile.masterToggle}</p>
                </div>
              </div>
              <div
                className={`relative h-7 w-12 rounded-full transition-colors ${settings.enabled ? "bg-primary" : "bg-slate-300"}`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow-md transition-all ${settings.enabled ? "left-6" : "left-1"}`}
                />
              </div>
            </button>

            <button
              onClick={() => {
                if (!settings.enabled) return;
                triggerHaptic("light");
                updateSetting("light", !settings.light);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-2 py-3 transition-colors hover:bg-[var(--color-surface-subtle)] ${!settings.enabled ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <span className="material-symbols-outlined text-lg text-green-500">circle</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[var(--color-on-surface)]">
                    {t.profile.lightTap}
                  </p>
                  <p className="text-xs text-[var(--color-outline)]">{t.profile.briefFeedback}</p>
                </div>
              </div>
              <div
                className={`relative h-7 w-12 rounded-full transition-colors ${settings.light ? "bg-primary" : "bg-slate-300"}`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow-md transition-all ${settings.light ? "left-6" : "left-1"}`}
                />
              </div>
            </button>

            <button
              onClick={() => {
                if (!settings.enabled) return;
                triggerHaptic("medium");
                updateSetting("medium", !settings.medium);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-2 py-3 transition-colors hover:bg-[var(--color-surface-subtle)] ${!settings.enabled ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <span className="material-symbols-outlined text-lg text-amber-500">
                    radio_button_checked
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[var(--color-on-surface)]">
                    {t.profile.mediumTap}
                  </p>
                  <p className="text-xs text-[var(--color-outline)]">
                    {t.profile.standardFeedback}
                  </p>
                </div>
              </div>
              <div
                className={`relative h-7 w-12 rounded-full transition-colors ${settings.medium ? "bg-primary" : "bg-slate-300"}`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow-md transition-all ${settings.medium ? "left-6" : "left-1"}`}
                />
              </div>
            </button>

            <button
              onClick={() => {
                if (!settings.enabled) return;
                triggerHaptic("heavy");
                updateSetting("heavy", !settings.heavy);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-2 py-3 transition-colors hover:bg-[var(--color-surface-subtle)] ${!settings.enabled ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <span className="material-symbols-outlined text-lg text-red-500">lens</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[var(--color-on-surface)]">
                    {t.profile.heavyTap}
                  </p>
                  <p className="text-xs text-[var(--color-outline)]">{t.profile.strongFeedback}</p>
                </div>
              </div>
              <div
                className={`relative h-7 w-12 rounded-full transition-colors ${settings.heavy ? "bg-primary" : "bg-slate-300"}`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow-md transition-all ${settings.heavy ? "left-6" : "left-1"}`}
                />
              </div>
            </button>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-4 rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 transition-colors hover:bg-red-50 dark:bg-[var(--color-surface-container)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 group-hover:bg-red-100">
            <span className="material-symbols-outlined text-red-500">logout</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-600">{t.profile.logOut}</p>
            <p className="text-xs text-[var(--color-outline)]">{t.profile.signOutAccount}</p>
          </div>
        </button>

        {/* App Version */}
        <p className="py-6 text-center text-xs text-[var(--color-outline-variant)]">
          MIIAM v2.5.0 • {t.profile.madeWithLove}
        </p>
      </main>
    </div>
  );
}
