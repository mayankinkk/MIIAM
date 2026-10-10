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
    { id: "parcel", label: "Parcels", icon: "📦" },
  ];

  // Load settings from DB on mount
  useEffect(() => {
    async function loadSettings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rider } = await supabase
        .from("riders")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!rider) return;
      setRiderId(rider.id);

      const { data: settings } = await supabase
        .from("rider_settings")
        .select("*")
        .eq("rider_id", rider.id)
        .single();
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
        const { data: newSettings } = await supabase
          .from("rider_settings")
          .insert({
            rider_id: rider.id,
          })
          .select()
          .single();
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
      const { data: newSettings } = await supabase
        .from("rider_settings")
        .insert({
          rider_id: riderId,
          ...updates,
        })
        .select()
        .single();
      if (newSettings) setSettingsId(newSettings.id);
    }
  };

  const toggleOrderType = (typeId: string) => {
    let newTypes: string[];
    if (preferredOrderTypes.includes(typeId)) {
      if (preferredOrderTypes.length > 1) {
        newTypes = preferredOrderTypes.filter((t) => t !== typeId);
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
      <header className="bg-brand-secondary rounded-b-[3rem] p-6 pb-8 text-white">
        <div className="flex items-center justify-between">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">
            MIIAM
          </Link>
        </div>
        <h1 className="mt-4 text-2xl font-bold">⚙️ Settings</h1>
        <p className="text-sm opacity-80">Customize your experience</p>
      </header>

      <main className="-mt-4 space-y-6 px-6 pb-32">
        {/* Account Section */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Account</h3>
          <div className="space-y-3">
            <Link
              href="/rider/account"
              className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  person
                </span>
                <span className="font-bold">Profile</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </Link>
            <Link
              href="/rider/documents"
              className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  badge
                </span>
                <span className="font-bold">Documents</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </Link>
            <Link
              href="/rider/vehicle"
              className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  two_wheeler
                </span>
                <span className="font-bold">My Vehicle</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </Link>
          </div>
        </div>

        {/* Order Preferences */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Order Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  autorenew
                </span>
                <span className="font-bold">Auto-Accept Orders</span>
              </div>
              <button
                onClick={() => {
                  setAutoAccept(!autoAccept);
                  saveSetting({ auto_accept: !autoAccept });
                }}
                role="switch"
                aria-checked={autoAccept}
                aria-label="Auto-accept orders"
                className={`h-6 w-12 rounded-full transition-colors ${autoAccept ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-transform ${autoAccept ? "translate-x-6" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  trending_up
                </span>
                <span className="font-bold">Only High Earnings</span>
              </div>
              <button
                onClick={() => {
                  setOnlyHighEarnings(!onlyHighEarnings);
                  saveSetting({ only_high_earnings: !onlyHighEarnings });
                }}
                role="switch"
                aria-checked={onlyHighEarnings}
                aria-label="Only high earnings"
                className={`h-6 w-12 rounded-full transition-colors ${onlyHighEarnings ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-transform ${onlyHighEarnings ? "translate-x-6" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            <div>
              <p className="mb-3 font-bold">Preferred Order Types</p>
              <div className="grid grid-cols-2 gap-2">
                {orderTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleOrderType(type.id)}
                    className={`flex items-center gap-2 rounded-xl p-3 transition-all ${
                      preferredOrderTypes.includes(type.id)
                        ? "bg-brand-secondary text-white"
                        : "bg-[var(--color-surface-subtle)] text-[var(--color-on-surface-variant)]"
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span className="text-sm font-bold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  volume_up
                </span>
                <span className="font-bold">Sound</span>
              </div>
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  saveSetting({ sound_enabled: !soundEnabled });
                }}
                role="switch"
                aria-checked={soundEnabled}
                aria-label="Sound"
                className={`h-6 w-12 rounded-full transition-colors ${soundEnabled ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-transform ${soundEnabled ? "translate-x-6" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  vibration
                </span>
                <span className="font-bold">Vibration</span>
              </div>
              <button
                onClick={() => {
                  setVibrationEnabled(!vibrationEnabled);
                  saveSetting({ vibration_enabled: !vibrationEnabled });
                }}
                role="switch"
                aria-checked={vibrationEnabled}
                aria-label="Vibration"
                className={`h-6 w-12 rounded-full transition-colors ${vibrationEnabled ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-transform ${vibrationEnabled ? "translate-x-6" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  do_not_disturb
                </span>
                <span className="font-bold">Do Not Disturb</span>
              </div>
              <button
                onClick={() => {
                  setDndMode(!dndMode);
                  saveSetting({ dnd_mode: !dndMode });
                }}
                role="switch"
                aria-checked={dndMode}
                aria-label="Do not disturb"
                className={`h-6 w-12 rounded-full transition-colors ${dndMode ? "bg-red-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-transform ${dndMode ? "translate-x-6" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            <Link href="/rider/notifications" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  notifications
                </span>
                <span className="font-bold">Notification History</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </Link>
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Appearance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  dark_mode
                </span>
                <span className="font-bold">Dark Mode</span>
              </div>
              <button
                onClick={() => {
                  setDarkMode(!darkMode);
                  saveSetting({ dark_mode: !darkMode });
                }}
                role="switch"
                aria-checked={darkMode}
                aria-label="Dark mode"
                className={`h-6 w-12 rounded-full transition-colors ${darkMode ? "bg-green-500" : "bg-slate-300 dark:bg-gray-600"}`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-transform ${darkMode ? "translate-x-6" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            <button
              onClick={() => setShowLanguageModal(true)}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  language
                </span>
                <span className="font-bold">Language</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-outline)]">{language}</span>
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                  chevron_right
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Support</h3>
          <div className="space-y-3">
            <Link
              href="/rider/support"
              className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  help
                </span>
                <span className="font-bold">Help Center</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </Link>
            <Link
              href="/rider/incident"
              className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">emergency</span>
                <span className="font-bold text-red-600">Report Incident</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </Link>
            <Link
              href="/rider/training"
              className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                  school
                </span>
                <span className="font-bold">Training</span>
              </div>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </Link>
          </div>
        </div>

        {/* Privacy & Legal */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Privacy & Legal</h3>
          <div className="space-y-3">
            <Link
              href="/privacy"
              className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
            >
              <span className="font-bold">Privacy Policy</span>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </Link>
            <Link
              href="/terms"
              className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
            >
              <span className="font-bold">Terms of Service</span>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </Link>
            <Link
              href="/privacy"
              className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
            >
              <span className="font-bold">Data & Privacy</span>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </Link>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-[var(--color-outline-variant)]">
          MIIAM Rider v1.0.0 • Made with ❤️
        </p>
      </main>

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6">
            <h3 className="mb-4 text-xl font-bold">Select Language</h3>
            <div className="space-y-2">
              {["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setShowLanguageModal(false);
                    saveSetting({ language: lang });
                  }}
                  className={`w-full rounded-xl p-4 text-left font-bold transition-all ${
                    language === lang
                      ? "bg-brand-secondary text-white"
                      : "bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-container)]"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLanguageModal(false)}
              className="mt-4 w-full py-3 font-bold text-[var(--color-outline)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
