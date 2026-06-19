"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useHapticStore } from "@/components/HapticFeedback";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";

export default function EnhancedProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ orders: 0, reviews: 0, saved: 0 });
  const [showHapticSettings, setShowHapticSettings] = useState(false);
  const { settings, updateSetting, triggerHaptic } = useHapticStore();

  const menuItems = [
    { id: "orders", icon: "receipt_long", label: t.profile.myOrders, sub: t.profile.viewAllOrders, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "bookings", icon: "calendar_month", label: t.profile.bookings, sub: t.profile.serviceAppointments, color: "text-amber-500", bg: "bg-amber-50" },
    { id: "subscriptions", icon: "repeat", label: t.profile.recurringOrders, sub: t.profile.scheduledSubscriptions, color: "text-purple-500", bg: "bg-purple-50" },
    { id: "addresses", icon: "location_on", label: t.profile.savedAddresses, sub: t.profile.manageDeliveryAddresses, color: "text-green-500", bg: "bg-green-50" },
    { id: "favorites", icon: "favorite", label: t.profile.favorites, sub: t.profile.yourSavedItems, color: "text-red-500", bg: "bg-red-50" },
    { id: "payment", icon: "payment", label: t.profile.paymentMethods, sub: t.profile.cardsUpiWallets, color: "text-purple-500", bg: "bg-purple-50" },
    { id: "support", icon: "support_agent", label: t.profile.helpSupport, sub: t.profile.twentyFourSevenSupport, color: "text-indigo-500", bg: "bg-indigo-50" },
    { id: "settings", icon: "settings", label: t.profile.settings, sub: t.profile.appPreferences, color: "text-[var(--color-outline)]", bg: "bg-[var(--color-surface-subtle)]" },
    { id: "haptic", icon: "vibration", label: t.profile.hapticFeedback, sub: t.profile.vibrationSettings, color: "text-cyan-500", bg: "bg-cyan-50", special: true },
  ];

  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
            saved: favCount || 0
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    loadUserAndProfile();
  }, [supabase]);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-[var(--color-surface)] pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary-container text-white p-6 pb-12 rounded-b-[3rem]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black">{t.profile.title}</h1>
          <Link href="/app/profile/edit" className="p-2 bg-[var(--color-surface-container-lowest)]/10 rounded-full hover:bg-[var(--color-surface-container-lowest)]/20 transition-colors">
            <span className="material-symbols-outlined">edit</span>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[var(--color-surface-container-lowest)]/20 flex items-center justify-center text-3xl font-black border-4 border-white/30 overflow-hidden">
            {profile?.avatar_url ? (
              <BlurImage src={profile.avatar_url} alt="Avatar" fill className="w-full h-full" sizes="80px" />
            ) : (
              user?.email?.[0]?.toUpperCase() || "U"
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black">{displayName}</h2>
            <p className="text-white/80 text-sm">{user?.email}</p>
            {profile?.phone && <p className="text-white/60 text-sm">{profile.phone}</p>}

          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-[var(--color-surface-container-lowest)]/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{stats.orders}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wider">{t.profile.orders}</p>
          </div>
          <div className="bg-[var(--color-surface-container-lowest)]/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{stats.reviews}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wider">{t.profile.reviews}</p>
          </div>
          <div className="bg-[var(--color-surface-container-lowest)]/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{stats.saved}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wider">{t.profile.saved}</p>
          </div>
        </div>
      </header>

      <Breadcrumbs items={[{ label: t.profile.home, href: '/app/explore' }, { label: t.profile.profileLabel }]} />

      {/* Menu Items */}
      <main className="px-6 -mt-6 space-y-4">
        {/* Menu Sections */}
        <div className="space-y-2">
          {menuItems.slice(0, 4).map((item) => (
            <Link key={item.id} href={`/app/${item.id}`} className="block bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[var(--color-on-surface)] dark:text-[var(--color-on-surface)]">{item.label}</p>
                <p className="text-xs text-[var(--color-outline)] dark:text-[var(--color-outline)]">{item.sub}</p>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]/60">chevron_right</span>
            </Link>
          ))}
        </div>

        {/* Second Section */}
        <div className="space-y-2">
          {menuItems.slice(4, 8).map((item) => (
            <Link key={item.id} href={`/app/${item.id}`} className="block bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[var(--color-on-surface)]">{item.label}</p>
                <p className="text-xs text-[var(--color-outline)]">{item.sub}</p>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]/60">chevron_right</span>
            </Link>
          ))}
        </div>

        {/* Settings Section */}
        <div className="space-y-2">
          {menuItems.slice(8).map((item) => (
            item.special ? (
              <button 
                key={item.id}
                onClick={() => {
                  triggerHaptic("medium");
                  setShowHapticSettings(!showHapticSettings);
                }}
                className="w-full bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-[var(--color-on-surface)]">{item.label}</p>
                  <p className="text-xs text-[var(--color-outline)]">{item.sub}</p>
                </div>
                <span className={`material-symbols-outlined text-[var(--color-outline-variant)]/60 transition-transform ${showHapticSettings ? "rotate-180" : ""}`}>expand_more</span>
              </button>
            ) : (
              <Link key={item.id} href={`/app/${item.id}`} className="block bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[var(--color-on-surface)]">{item.label}</p>
                  <p className="text-xs text-[var(--color-outline)]">{item.sub}</p>
                </div>
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]/60">chevron_right</span>
              </Link>
            )
          ))}
        </div>

        {/* Haptic Feedback Settings Panel */}
        {showHapticSettings && (
          <div className="bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] rounded-2xl p-4 space-y-2 animate-fade-in">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--color-border-subtle)]">
              <span className="material-symbols-outlined text-primary">vibration</span>
              <p className="font-bold text-[var(--color-on-surface)]">{t.profile.hapticFeedbackSettings}</p>
            </div>
            
            <button
              onClick={() => updateSetting("enabled", !settings.enabled)}
              className="w-full flex items-center justify-between py-3 hover:bg-[var(--color-surface-subtle)] rounded-xl px-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-cyan-500">power_settings_new</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[var(--color-on-surface)]">{t.profile.enableHaptics}</p>
                  <p className="text-xs text-[var(--color-outline)]">{t.profile.masterToggle}</p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full relative transition-colors ${settings.enabled ? "bg-primary" : "bg-slate-300"}`}>
                <div className={`absolute top-1 w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow-md transition-all ${settings.enabled ? "left-6" : "left-1"}`} />
              </div>
            </button>

            <button
              onClick={() => {
                if (!settings.enabled) return;
                triggerHaptic("light");
                updateSetting("light", !settings.light);
              }}
              className={`w-full flex items-center justify-between py-3 hover:bg-[var(--color-surface-subtle)] rounded-xl px-2 transition-colors ${!settings.enabled ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500 text-lg">circle</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[var(--color-on-surface)]">{t.profile.lightTap}</p>
                  <p className="text-xs text-[var(--color-outline)]">{t.profile.briefFeedback}</p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full relative transition-colors ${settings.light ? "bg-primary" : "bg-slate-300"}`}>
                <div className={`absolute top-1 w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow-md transition-all ${settings.light ? "left-6" : "left-1"}`} />
              </div>
            </button>

            <button
              onClick={() => {
                if (!settings.enabled) return;
                triggerHaptic("medium");
                updateSetting("medium", !settings.medium);
              }}
              className={`w-full flex items-center justify-between py-3 hover:bg-[var(--color-surface-subtle)] rounded-xl px-2 transition-colors ${!settings.enabled ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-500 text-lg">radio_button_checked</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[var(--color-on-surface)]">{t.profile.mediumTap}</p>
                  <p className="text-xs text-[var(--color-outline)]">{t.profile.standardFeedback}</p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full relative transition-colors ${settings.medium ? "bg-primary" : "bg-slate-300"}`}>
                <div className={`absolute top-1 w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow-md transition-all ${settings.medium ? "left-6" : "left-1"}`} />
              </div>
            </button>

            <button
              onClick={() => {
                if (!settings.enabled) return;
                triggerHaptic("heavy");
                updateSetting("heavy", !settings.heavy);
              }}
              className={`w-full flex items-center justify-between py-3 hover:bg-[var(--color-surface-subtle)] rounded-xl px-2 transition-colors ${!settings.enabled ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500 text-lg">lens</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[var(--color-on-surface)]">{t.profile.heavyTap}</p>
                  <p className="text-xs text-[var(--color-outline)]">{t.profile.strongFeedback}</p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full relative transition-colors ${settings.heavy ? "bg-primary" : "bg-slate-300"}`}>
                <div className={`absolute top-1 w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow-md transition-all ${settings.heavy ? "left-6" : "left-1"}`} />
              </div>
            </button>
          </div>
        )}

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] rounded-2xl p-4 flex items-center gap-4 hover:bg-red-50 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100">
            <span className="material-symbols-outlined text-red-500">logout</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-600">{t.profile.logOut}</p>
            <p className="text-xs text-[var(--color-outline)]">{t.profile.signOutAccount}</p>
          </div>
        </button>

        {/* App Version */}
        <p className="text-center text-xs text-[var(--color-outline-variant)] py-6">
          MIIAM v2.5.0 • {t.profile.madeWithLove}
        </p>
      </main>
    </div>
  );
}
