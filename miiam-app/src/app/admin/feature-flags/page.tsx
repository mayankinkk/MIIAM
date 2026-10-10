"use client";

import { useState, useEffect } from "react";
import { useToastStore } from "@/lib/store/toastStore";

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
}

const flags: FeatureFlag[] = [
  {
    key: "feature_food_enabled",
    label: "Food Ordering",
    description: "Enable food delivery ordering feature",
  },
  {
    key: "feature_grocery_enabled",
    label: "Grocery Ordering",
    description: "Enable grocery ordering feature",
  },
  {
    key: "feature_flowers_enabled",
    label: "Flowers Ordering",
    description: "Enable flowers ordering feature",
  },
  {
    key: "feature_printing_enabled",
    label: "Printing Services",
    description: "Enable printing services feature",
  },
  {
    key: "feature_wallet_enabled",
    label: "Wallet Feature",
    description: "Enable in-app wallet and payments",
  },
  { key: "feature_chat_enabled", label: "Chat Feature", description: "Enable in-app chat support" },
  {
    key: "feature_notifications_enabled",
    label: "Push Notifications",
    description: "Enable push notification delivery",
  },
];

export default function FeatureFlagsPage() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [flagValues, setFlagValues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    async function loadFlags() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        const loaded: Record<string, boolean> = {};
        flags.forEach((f) => {
          loaded[f.key] = data.settings?.[f.key] === "true";
        });
        if (!cancelled) setFlagValues(loaded);
      } catch {
        addToast("Failed to load feature flags", "error");
      }
      if (!cancelled) setLoading(false);
    }
    loadFlags();
    return () => {
      cancelled = true;
    };
  }, [addToast]);

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
    <div className="space-y-8 px-8">
      <div>
        <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Feature Flags</h1>
        <p className="text-sm text-[var(--color-outline-variant)]">
          Toggle platform features on or off
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-8 shadow-sm">
        <h3 className="mb-6 text-sm font-black tracking-widest text-[var(--color-on-surface)] uppercase">
          Active Features
        </h3>
        {loading ? (
          <div className="space-y-4">
            {flags.map((f) => (
              <div
                key={f.key}
                className="flex animate-pulse items-center justify-between rounded-xl border border-[var(--color-border-subtle)] p-4"
              >
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-[var(--color-surface-subtle)]" />
                  <div className="h-3 w-48 rounded bg-[var(--color-surface-subtle)]" />
                </div>
                <div className="h-6 w-12 rounded-full bg-[var(--color-surface-subtle)]" />
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
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border-subtle)] p-4 transition-colors hover:bg-[var(--color-surface-subtle)]"
                >
                  <div>
                    <p className="font-bold text-[var(--color-on-surface)]">{flag.label}</p>
                    <p className="text-xs text-[var(--color-outline-variant)]">
                      {flag.description}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFlag(flag)}
                    disabled={savingKey === flag.key}
                    role="switch"
                    aria-checked={isEnabled}
                    aria-label={`Toggle ${flag.label}`}
                    className={`relative h-6 w-12 rounded-full transition-colors disabled:opacity-50 ${
                      isEnabled ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-[var(--color-surface-container-lowest)] transition-all ${
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
