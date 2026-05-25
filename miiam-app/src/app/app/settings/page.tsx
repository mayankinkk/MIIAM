"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Breadcrumbs from "@/components/Breadcrumbs";

const supabase = createClient();

const settingsSections = [
  {
    title: "Account",
    items: [
      { id: "profile", icon: "person", label: "Edit Profile", sub: "Name, phone, email", href: "/app/profile/edit" },
      { id: "addresses", icon: "location_on", label: "Saved Addresses", sub: "Manage delivery addresses", href: "/app/addresses" },
      { id: "security", icon: "security", label: "Security", sub: "Password, 2FA", href: "/app/settings/security" },
    ]
  },
  {
    title: "Preferences",
    items: [
      { id: "notifications", icon: "notifications", label: "Notifications", sub: "Push, SMS, email settings", href: "/app/notifications" },
      { id: "language", icon: "language", label: "Language", sub: "English, Hindi", href: "/app/settings/language" },
      { id: "theme", icon: "dark_mode", label: "Theme", sub: "Light, Dark, System", href: "/app/settings/theme" },
    ]
  },
  {
    title: "Support",
    items: [
      { id: "help", icon: "help", label: "Help Center", sub: "FAQs and support", href: "/app/support" },
      { id: "chat", icon: "chat", label: "Chat with Us", sub: "Live chat support", href: "/app/support/chat" },
      { id: "legal", icon: "description", label: "Legal", sub: "Terms, Privacy, Refund", href: "/app/settings/legal" },
    ]
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-24">
      <header className="bg-surface-container px-6 py-4 sticky top-0 z-10 border-b border-outline-variant/10 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/app/profile" className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-on-background">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-surface">Settings</h1>
          <div className="w-10" />
        </div>
      </header>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Profile', href: '/app/profile' }, { label: 'Settings' }]} />

      <main className="p-6">
        {settingsSections.map((section, sectionIndex) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mb-3">{section.title}</h2>
            <div className="bg-surface-container rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
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

        <div className="bg-surface-container rounded-2xl overflow-hidden shadow-sm mt-6 border border-outline-variant/10">
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 hover:bg-red-500/10 transition-colors"
          >
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600">logout</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-red-600">{loading ? "Signing out..." : "Sign Out"}</p>
              <p className="text-xs text-red-500/60">Log out of your account</p>
            </div>
            <span className="material-symbols-outlined text-red-400">chevron_right</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-on-surface-variant/60">MIIAM v1.0.0</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">Made with ❤️ in India</p>
        </div>
      </main>
    </div>
  );
}