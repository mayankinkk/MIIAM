"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RiderSettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [language, setLanguage] = useState("English");
  const [autoAccept, setAutoAccept] = useState(false);
  const [onlyHighEarnings, setOnlyHighEarnings] = useState(false);
  const [dndMode, setDndMode] = useState(false);
  const [preferredOrderTypes, setPreferredOrderTypes] = useState<string[]>(["food", "grocery"]);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const orderTypes = [
    { id: "food", label: "Food Delivery", icon: "🍔" },
    { id: "grocery", label: "Grocery", icon: "🛒" },
    { id: "pharmacy", label: "Pharmacy", icon: "💊" },
    { id: "parcel", label: "Parcels", icon: "📦" },
  ];

  // Load settings from DB on mount
  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rider } = await supabase.from("riders").select("id").eq("user_id", user.id).single();
      if (!rider) return;
      setRiderId(rider.id);

      const { data: settings } = await supabase.from("rider_settings").select("*").eq("rider_id", rider.id).single();
      if (settings) {
        setSettingsId(settings.id);
        setDarkMode(settings.dark_mode || false);
        setSoundEnabled(settings.sound_enabled !== false);
        setVibrationEnabled(settings.vibration_enabled !== false);
        setLanguage(settings.language || "English");
        setAutoAccept(settings.auto_accept || false);
        setOnlyHighEarnings(settings.only_high_earnings || false);
        setDndMode(settings.dnd_mode || false);
        setPreferredOrderTypes(settings.preferred_order_types || ["food", "grocery"]);
      } else {
        // Create default settings
        const { data: newSettings } = await supabase.from("rider_settings").insert({
          rider_id: rider.id,
        }).select().single();
        if (newSettings) setSettingsId(newSettings.id);
      }
    }
    loadSettings();
  }, [supabase]);

  // Save individual setting to DB
  const saveSetting = async (updates: Record<string, any>) => {
    if (!riderId) return;
    if (settingsId) {
      await supabase.from("rider_settings").update(updates).eq("id", settingsId);
    } else {
      const { data: newSettings } = await supabase.from("rider_settings").insert({
        rider_id: riderId,
        ...updates,
      }).select().single();
      if (newSettings) setSettingsId(newSettings.id);
    }
  };

  const toggleOrderType = (typeId: string) => {
    let newTypes: string[];
    if (preferredOrderTypes.includes(typeId)) {
      if (preferredOrderTypes.length > 1) {
        newTypes = preferredOrderTypes.filter(t => t !== typeId);
      } else {
        return;
      }
    } else {
      newTypes = [...preferredOrderTypes, typeId];
    }
    setPreferredOrderTypes(newTypes);
    saveSetting({ preferred_order_types: newTypes });
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="bg-brand-secondary text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
        </div>
        <h1 className="text-2xl font-bold mt-4">⚙️ Settings</h1>
        <p className="text-sm opacity-80">Customize your experience</p>
      </header>

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* Account Section */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Account</h3>
          <div className="space-y-3">
            <Link href="/rider/account" className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">person</span>
                <span className="font-bold">Profile</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
            </Link>
            <Link href="/rider/documents" className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">badge</span>
                <span className="font-bold">Documents</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
            </Link>
            <Link href="/rider/vehicle" className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">two_wheeler</span>
                <span className="font-bold">My Vehicle</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* Order Preferences */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Order Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">autorenew</span>
                <span className="font-bold">Auto-Accept Orders</span>
              </div>
              <button 
                onClick={() => { setAutoAccept(!autoAccept); saveSetting({ auto_accept: !autoAccept }); }}
                role="switch"
                aria-checked={autoAccept}
                aria-label="Auto-accept orders"
                className={`w-12 h-6 rounded-full transition-colors ${autoAccept ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <div className={`w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow transition-transform ${autoAccept ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">trending_up</span>
                <span className="font-bold">Only High Earnings</span>
              </div>
              <button 
                onClick={() => { setOnlyHighEarnings(!onlyHighEarnings); saveSetting({ only_high_earnings: !onlyHighEarnings }); }}
                role="switch"
                aria-checked={onlyHighEarnings}
                aria-label="Only high earnings"
                className={`w-12 h-6 rounded-full transition-colors ${onlyHighEarnings ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <div className={`w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow transition-transform ${onlyHighEarnings ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div>
              <p className="font-bold mb-3">Preferred Order Types</p>
              <div className="grid grid-cols-2 gap-2">
                {orderTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleOrderType(type.id)}
                    className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
                      preferredOrderTypes.includes(type.id)
                        ? "bg-brand-secondary text-white"
                        : "bg-[var(--color-surface-subtle)] text-[var(--color-on-surface-variant)]"
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span className="font-bold text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">volume_up</span>
                <span className="font-bold">Sound</span>
              </div>
              <button 
                onClick={() => { setSoundEnabled(!soundEnabled); saveSetting({ sound_enabled: !soundEnabled }); }}
                role="switch"
                aria-checked={soundEnabled}
                aria-label="Sound"
                className={`w-12 h-6 rounded-full transition-colors ${soundEnabled ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <div className={`w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow transition-transform ${soundEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">vibration</span>
                <span className="font-bold">Vibration</span>
              </div>
              <button 
                onClick={() => { setVibrationEnabled(!vibrationEnabled); saveSetting({ vibration_enabled: !vibrationEnabled }); }}
                role="switch"
                aria-checked={vibrationEnabled}
                aria-label="Vibration"
                className={`w-12 h-6 rounded-full transition-colors ${vibrationEnabled ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <div className={`w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow transition-transform ${vibrationEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">do_not_disturb</span>
                <span className="font-bold">Do Not Disturb</span>
              </div>
              <button 
                onClick={() => { setDndMode(!dndMode); saveSetting({ dnd_mode: !dndMode }); }}
                role="switch"
                aria-checked={dndMode}
                aria-label="Do not disturb"
                className={`w-12 h-6 rounded-full transition-colors ${dndMode ? "bg-red-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <div className={`w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow transition-transform ${dndMode ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>

            <Link href="/rider/notifications" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">notifications</span>
                <span className="font-bold">Notification History</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Appearance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">dark_mode</span>
                <span className="font-bold">Dark Mode</span>
              </div>
              <button 
                onClick={() => { setDarkMode(!darkMode); saveSetting({ dark_mode: !darkMode }); }}
                role="switch"
                aria-checked={darkMode}
                aria-label="Dark mode"
                className={`w-12 h-6 rounded-full transition-colors ${darkMode ? "bg-green-500" : "bg-slate-300 dark:bg-gray-600"}`}
              >
                <div className={`w-5 h-5 bg-[var(--color-surface-container-lowest)] rounded-full shadow transition-transform ${darkMode ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
            
            <button 
              onClick={() => setShowLanguageModal(true)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">language</span>
                <span className="font-bold">Language</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-outline)]">{language}</span>
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
              </div>
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Support</h3>
          <div className="space-y-3">
            <Link href="/rider/support" className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">help</span>
                <span className="font-bold">Help Center</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
            </Link>
            <Link href="/rider/incident" className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">emergency</span>
                <span className="font-bold text-red-600">Report Incident</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
            </Link>
            <Link href="/rider/training" className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">school</span>
                <span className="font-bold">Training</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* Privacy & Legal */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Privacy & Legal</h3>
          <div className="space-y-3">
            <Link href="/privacy" className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl">
              <span className="font-bold">Privacy Policy</span>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
            </Link>
            <Link href="/terms" className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl">
              <span className="font-bold">Terms of Service</span>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
            </Link>
            <Link href="/privacy" className="flex items-center justify-between p-3 bg-[var(--color-surface-subtle)] rounded-xl">
              <span className="font-bold">Data & Privacy</span>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-[var(--color-outline-variant)]">MIIAM Rider v1.0.0 • Made with ❤️</p>
      </main>

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl mb-4">Select Language</h3>
            <div className="space-y-2">
              {["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLanguageModal(false); saveSetting({ language: lang }); }}
                  className={`w-full p-4 rounded-xl font-bold text-left transition-all ${
                    language === lang 
                      ? "bg-brand-secondary text-white" 
                      : "bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-container)]"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <button onClick={() => setShowLanguageModal(false)} className="w-full py-3 text-[var(--color-outline)] font-bold mt-4">
              Cancel
            </button>
          </div>
        </div>
      )}


    </div>
  );
}