"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      <header className="bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Link href="/app/profile" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a]">Settings</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-6">
        {settingsSections.map((section, sectionIndex) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{section.title}</h2>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {section.items.map((item, itemIndex) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors ${
                    itemIndex !== section.items.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-600">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.sub}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mt-6">
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors"
          >
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600">logout</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-red-600">{loading ? "Signing out..." : "Sign Out"}</p>
              <p className="text-xs text-red-400">Log out of your account</p>
            </div>
            <span className="material-symbols-outlined text-red-400">chevron_right</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">MIIAM v1.0.0</p>
          <p className="text-xs text-slate-400 mt-1">Made with ❤️ in India</p>
        </div>
      </main>
    </div>
  );
}