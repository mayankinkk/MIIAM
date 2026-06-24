"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
}

const flags: FeatureFlag[] = [
  { key: "feature_food_enabled", label: "Food Ordering", description: "Enable food delivery ordering feature" },
  { key: "feature_grocery_enabled", label: "Grocery Ordering", description: "Enable grocery ordering feature" },
  { key: "feature_pharmacy_enabled", label: "Pharmacy Ordering", description: "Enable pharmacy ordering feature" },
  { key: "feature_flowers_enabled", label: "Flowers Ordering", description: "Enable flowers ordering feature" },
  { key: "feature_printing_enabled", label: "Printing Services", description: "Enable printing services feature" },
  { key: "feature_wallet_enabled", label: "Wallet Feature", description: "Enable in-app wallet and payments" },
  { key: "feature_chat_enabled", label: "Chat Feature", description: "Enable in-app chat support" },
  { key: "feature_notifications_enabled", label: "Push Notifications", description: "Enable push notification delivery" },
];

export default function FeatureFlagsPage() {
  const _supabase = useMemo(() => createClient(), []);
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [flagValues, setFlagValues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFlags() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      const loaded: Record<string, boolean> = {};
      flags.forEach((f) => {
        loaded[f.key] = data.settings?.[f.key] === "true";
      });
      setFlagValues(loaded);
    } catch {
      addToast("Failed to load feature flags", "error");
    }
    setLoading(false);
  }

  async function toggleFlag(flag: FeatureFlag) {
    const newValue = !flagValues[flag.key];
    setSavingKey(flag.key);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: flag.key, value: String(newValue) }),
      });
      if (!res.ok) throw new Error("Request failed");
      setFlagValues((prev) => ({ ...prev, [flag.key]: newValue }));
      addToast(`${flag.label} ${newValue ? "enabled" : "disabled"}`, "success");
    } catch {
      addToast(`Failed to update ${flag.label}`, "error");
    }
    setSavingKey(null);
  }

  return (
    <div className="px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Feature Flags</h1>
        <p className="text-[var(--color-outline-variant)] text-sm">Toggle platform features on or off</p>
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-8 shadow-sm">
        <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm mb-6">Active Features</h3>
        {loading ? (
          <div className="space-y-4">
            {flags.map((f) => (
              <div key={f.key} className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-xl animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-[var(--color-surface-subtle)] rounded" />
                  <div className="h-3 w-48 bg-[var(--color-surface-subtle)] rounded" />
                </div>
                <div className="w-12 h-6 bg-[var(--color-surface-subtle)] rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {flags.map((flag) => {
              const isEnabled = flagValues[flag.key] ?? false;
              return (
                <div
                  key={flag.key}
                  className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-xl hover:bg-[var(--color-surface-subtle)] transition-colors"
                >
                  <div>
                    <p className="font-bold text-[var(--color-on-surface)]">{flag.label}</p>
                    <p className="text-xs text-[var(--color-outline-variant)]">{flag.description}</p>
                  </div>
                  <button
                    onClick={() => toggleFlag(flag)}
                    disabled={savingKey === flag.key}
                    role="switch"
                    aria-checked={isEnabled}
                    aria-label={`Toggle ${flag.label}`}
                    className={`w-12 h-6 rounded-full relative transition-colors disabled:opacity-50 ${
                      isEnabled ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-[var(--color-surface-container-lowest)] rounded-full transition-all ${
                        isEnabled ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
