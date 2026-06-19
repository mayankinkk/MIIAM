"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";

interface Settings {
  [key: string]: string | undefined;
  platform_name?: string;
  support_email?: string;
  support_phone?: string;
  platform_url?: string;
  maintenance_mode?: string;
  new_user_registration?: string;
  partner_onboarding?: string;
  default_delivery_fee?: string;
  free_delivery_above?: string;
  max_delivery_radius?: string;
  max_order_value?: string;
  cancellation_grace_period?: string;
  auto_accept_orders?: string;
  platform_commission?: string;
  payment_gateway_fee?: string;
  payout_frequency?: string;
  min_payout_amount?: string;
  grievance_email?: string;
  business_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  terms_content?: string;
  privacy_content?: string;
  refund_content?: string;
}

interface HealthCheck {
  label: string;
  status: "healthy" | "down" | "slow" | "loading";
  value: string;
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { addToast: _addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings>({});
  const [health, setHealth] = useState<HealthCheck[]>([
    { label: "Database", status: "loading", value: "Checking..." },
    { label: "API Response", status: "loading", value: "Checking..." },
    { label: "Memory", status: "loading", value: "Checking..." },
    { label: "Network", status: "loading", value: "Checking..." },
    { label: "Settings Sync", status: "loading", value: "Checking..." },
  ]);

  const runHealthChecks = useCallback(async () => {
    setHealth([
      { label: "Database", status: "loading", value: "Checking..." },
      { label: "API Response", status: "loading", value: "Checking..." },
      { label: "Memory", status: "loading", value: "Checking..." },
      { label: "Network", status: "loading", value: "Checking..." },
      { label: "Settings Sync", status: "loading", value: "Checking..." },
    ]);

    const dbCheck = (async () => {
      try {
        const res = await supabase
          .from("site_settings")
          .select("id", { count: "exact", head: true });
        if (res.error) return { label: "Database", status: "down" as const, value: res.error.message };
        return { label: "Database", status: "healthy" as const, value: "Connected" };
      } catch {
        return { label: "Database", status: "down" as const, value: "Connection failed" };
      }
    })();

    const apiCheck = (async () => {
      const start = performance.now();
      try {
        const res = await fetch("/api/settings");
        const ms = Math.round(performance.now() - start);
        if (!res.ok) return { label: "API Response", status: "down" as const, value: `${res.status} — ${ms}ms` };
        return { label: "API Response", status: ms > 1000 ? "slow" as const : "healthy" as const, value: `${ms}ms` };
      } catch {
        return { label: "API Response", status: "down" as const, value: "Unreachable" };
      }
    })();

    const memCheck = (() => {
      const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
      if (mem) return { label: "Memory", status: "healthy" as const, value: `${mem} GB` };
      return { label: "Memory", status: "healthy" as const, value: "Not available (SPA)" };
    })();

    const netCheck = (() => {
      if (navigator.onLine) return { label: "Network", status: "healthy" as const, value: "Online" };
      return { label: "Network", status: "down" as const, value: "Offline" };
    })();

    const syncCheck = (async () => {
      const start = performance.now();
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        const ms = Math.round(performance.now() - start);
        const count = data.settings ? Object.keys(data.settings).length : 0;
        return { label: "Settings Sync", status: ms > 1000 ? "slow" as const : "healthy" as const, value: `${count} keys loaded in ${ms}ms` };
      } catch {
        return { label: "Settings Sync", status: "down" as const, value: "Sync failed" };
      }
    })();

    const results = await Promise.all([dbCheck, apiCheck, memCheck, netCheck, syncCheck]);
    setHealth(results);
  }, [supabase]);

  useEffect(() => {
    loadSettings();
    runHealthChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
    setLoading(false);
  }

  async function saveSettings() {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
    setLoading(false);
  }

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function toggleKey(key: string) {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === "true" ? "false" : "true",
    }));
  }

  const isOn = (key: string) => settings[key] === "true";

  return (
    <div className="px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Settings</h1>
        <p className="text-[var(--color-outline-variant)] text-sm">Platform configuration and preferences</p>
      </div>

      <div className="flex gap-4">
        {["general", "delivery", "payments", "notifications", "support", "legal", "system health"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase ${
              activeTab === tab
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] border border-[var(--color-border-subtle)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-8 shadow-sm">
            <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm mb-6">Platform Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="settings-platform-name" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Platform Name</label>
                <input
                  id="settings-platform-name"
                  value={settings.platform_name || ""}
                  onChange={(e) => handleChange("platform_name", e.target.value)}
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-support-email" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Support Email</label>
                <input
                  id="settings-support-email"
                  type="email"
                  value={settings.support_email || ""}
                  onChange={(e) => handleChange("support_email", e.target.value)}
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-support-phone" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Support Phone</label>
                <input
                  id="settings-support-phone"
                  type="tel"
                  value={settings.support_phone || ""}
                  onChange={(e) => handleChange("support_phone", e.target.value)}
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-platform-url" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Platform URL</label>
                <input
                  id="settings-platform-url"
                  value={settings.platform_url || ""}
                  onChange={(e) => handleChange("platform_url", e.target.value)}
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-8 shadow-sm">
            <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm mb-6">Business Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-xl">
                <div>
                  <p className="font-bold text-[var(--color-on-surface)]">Maintenance Mode</p>
                  <p className="text-xs text-[var(--color-outline-variant)]">Disable platform for maintenance</p>
                </div>
                <button
                  onClick={() => toggleKey("maintenance_mode")}
                  role="switch"
                  aria-checked={isOn("maintenance_mode")}
                  aria-label="Toggle Maintenance Mode"
                  className={`w-12 h-6 rounded-full relative transition-colors ${isOn("maintenance_mode") ? "bg-red-500" : "bg-[var(--color-surface-container-high)]"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-[var(--color-surface-container-lowest)] rounded-full transition-all ${isOn("maintenance_mode") ? "right-1" : "left-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-xl">
                <div>
                  <p className="font-bold text-[var(--color-on-surface)]">New User Registration</p>
                  <p className="text-xs text-[var(--color-outline-variant)]">Allow new users to sign up</p>
                </div>
                <button
                  onClick={() => toggleKey("new_user_registration")}
                  role="switch"
                  aria-checked={isOn("new_user_registration")}
                  aria-label="Toggle New User Registration"
                  className={`w-12 h-6 rounded-full relative transition-colors ${isOn("new_user_registration") ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-[var(--color-surface-container-lowest)] rounded-full transition-all ${isOn("new_user_registration") ? "right-1" : "left-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-xl">
                <div>
                  <p className="font-bold text-[var(--color-on-surface)]">Partner Onboarding</p>
                  <p className="text-xs text-[var(--color-outline-variant)]">Allow new vendors to apply</p>
                </div>
                <button
                  onClick={() => toggleKey("partner_onboarding")}
                  role="switch"
                  aria-checked={isOn("partner_onboarding")}
                  aria-label="Toggle Partner Onboarding"
                  className={`w-12 h-6 rounded-full relative transition-colors ${isOn("partner_onboarding") ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-[var(--color-surface-container-lowest)] rounded-full transition-all ${isOn("partner_onboarding") ? "right-1" : "left-1"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "delivery" && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-8 shadow-sm">
          <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm mb-6">Delivery Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="settings-delivery-fee" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Default Delivery Fee (₹)</label>
              <input
                id="settings-delivery-fee"
                value={settings.default_delivery_fee || ""}
                onChange={(e) => handleChange("default_delivery_fee", e.target.value)}
                className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div>
              <label htmlFor="settings-free-delivery" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Free Delivery Above (₹)</label>
              <input
                id="settings-free-delivery"
                value={settings.free_delivery_above || ""}
                onChange={(e) => handleChange("free_delivery_above", e.target.value)}
                className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div>
              <label htmlFor="settings-delivery-radius" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Max Delivery Radius (km)</label>
              <input
                id="settings-delivery-radius"
                value={settings.max_delivery_radius || ""}
                onChange={(e) => handleChange("max_delivery_radius", e.target.value)}
                className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div>
              <label htmlFor="settings-max-order" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Max Order Value (₹)</label>
              <input
                id="settings-max-order"
                value={settings.max_order_value || ""}
                onChange={(e) => handleChange("max_order_value", e.target.value)}
                className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div>
              <label htmlFor="settings-cancellation-grace" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Cancellation Grace Period (seconds)</label>
              <input
                id="settings-cancellation-grace"
                value={settings.cancellation_grace_period || ""}
                onChange={(e) => handleChange("cancellation_grace_period", e.target.value)}
                className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div>
              <label htmlFor="settings-auto-accept" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Auto-Accept Orders</label>
              <select
                id="settings-auto-accept"
                value={settings.auto_accept_orders || "true"}
                onChange={(e) => handleChange("auto_accept_orders", e.target.value)}
                className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-8 shadow-sm">
          <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm mb-6">Payment Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="settings-platform-commission" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Platform Commission (%)</label>
              <input
                id="settings-platform-commission"
                value={settings.platform_commission || ""}
                onChange={(e) => handleChange("platform_commission", e.target.value)}
                className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div>
              <label htmlFor="settings-gateway-fee" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Payment Gateway Fee (%)</label>
              <input
                id="settings-gateway-fee"
                value={settings.payment_gateway_fee || ""}
                onChange={(e) => handleChange("payment_gateway_fee", e.target.value)}
                className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div>
              <label htmlFor="settings-payout-frequency" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Payout Frequency</label>
              <select
                id="settings-payout-frequency"
                value={settings.payout_frequency || "daily"}
                onChange={(e) => handleChange("payout_frequency", e.target.value)}
                className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
              </select>
            </div>
            <div>
              <label htmlFor="settings-min-payout" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Min Payout Amount (₹)</label>
              <input
                id="settings-min-payout"
                value={settings.min_payout_amount || ""}
                onChange={(e) => handleChange("min_payout_amount", e.target.value)}
                className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-8 shadow-sm">
          <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm mb-6">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-xl">
              <div>
                <p className="font-bold text-[var(--color-on-surface)]">Order Updates</p>
                <p className="text-xs text-[var(--color-outline-variant)]">Send push notifications for order status changes</p>
              </div>
              <button
                onClick={() => toggleKey("notif_order_updates")}
                role="switch"
                aria-checked={isOn("notif_order_updates")}
                aria-label="Toggle Order Update Notifications"
                className={`w-12 h-6 rounded-full relative transition-colors ${isOn("notif_order_updates") ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-[var(--color-surface-container-lowest)] rounded-full transition-all ${isOn("notif_order_updates") ? "right-1" : "left-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-xl">
              <div>
                <p className="font-bold text-[var(--color-on-surface)]">Promotional Notifications</p>
                <p className="text-xs text-[var(--color-outline-variant)]">Send offers and deals to users</p>
              </div>
              <button
                onClick={() => toggleKey("notif_promotions")}
                role="switch"
                aria-checked={isOn("notif_promotions")}
                aria-label="Toggle Promotional Notifications"
                className={`w-12 h-6 rounded-full relative transition-colors ${isOn("notif_promotions") ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-[var(--color-surface-container-lowest)] rounded-full transition-all ${isOn("notif_promotions") ? "right-1" : "left-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border border-[var(--color-border-subtle)] rounded-xl">
              <div>
                <p className="font-bold text-[var(--color-on-surface)]">SMS Notifications</p>
                <p className="text-xs text-[var(--color-outline-variant)]">Send SMS for critical updates</p>
              </div>
              <button
                onClick={() => toggleKey("notif_sms")}
                role="switch"
                aria-checked={isOn("notif_sms")}
                aria-label="Toggle SMS Notifications"
                className={`w-12 h-6 rounded-full relative transition-colors ${isOn("notif_sms") ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-[var(--color-surface-container-lowest)] rounded-full transition-all ${isOn("notif_sms") ? "right-1" : "left-1"}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "support" && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-8 shadow-sm">
            <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm mb-6">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="settings-support-phone-number" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Support Phone Number</label>
                <input
                  id="settings-support-phone-number"
                  type="tel"
                  value={settings.support_phone || ""}
                  onChange={(e) => handleChange("support_phone", e.target.value)}
                  placeholder="+9118001234567"
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-phone-label" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Phone Display Label</label>
                <input
                  id="settings-phone-label"
                  value={settings.support_phone_label || ""}
                  onChange={(e) => handleChange("support_phone_label", e.target.value)}
                  placeholder="1800-123-4567 (Toll free)"
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-support-email-support" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Support Email</label>
                <input
                  id="settings-support-email-support"
                  type="email"
                  value={settings.support_email || ""}
                  onChange={(e) => handleChange("support_email", e.target.value)}
                  placeholder="support@miiam.in"
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-whatsapp" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">WhatsApp Number</label>
                <input
                  id="settings-whatsapp"
                  value={settings.support_whatsapp || ""}
                  onChange={(e) => handleChange("support_whatsapp", e.target.value)}
                  placeholder="+9118001234567"
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-chat-response" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Chat Response Time</label>
                <input
                  id="settings-chat-response"
                  value={settings.support_response_time || ""}
                  onChange={(e) => handleChange("support_response_time", e.target.value)}
                  placeholder="2 mins"
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-email-response" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Email Response Time</label>
                <input
                  id="settings-email-response"
                  value={settings.support_email_response_time || ""}
                  onChange={(e) => handleChange("support_email_response_time", e.target.value)}
                  placeholder="24 hours"
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-8 shadow-sm">
            <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm mb-6">Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="settings-twitter" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Twitter / X</label>
                <input
                  id="settings-twitter"
                  value={settings.support_twitter || ""}
                  onChange={(e) => handleChange("support_twitter", e.target.value)}
                  placeholder="https://twitter.com/miiam_in"
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-instagram" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Instagram</label>
                <input
                  id="settings-instagram"
                  value={settings.support_instagram || ""}
                  onChange={(e) => handleChange("support_instagram", e.target.value)}
                  placeholder="https://instagram.com/miiam_in"
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-facebook" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Facebook</label>
                <input
                  id="settings-facebook"
                  value={settings.support_facebook || ""}
                  onChange={(e) => handleChange("support_facebook", e.target.value)}
                  placeholder="https://facebook.com/miiam.in"
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-linkedin" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">LinkedIn</label>
                <input
                  id="settings-linkedin"
                  value={settings.support_linkedin || ""}
                  onChange={(e) => handleChange("support_linkedin", e.target.value)}
                  placeholder="https://linkedin.com/company/miiam"
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-youtube" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">YouTube</label>
                <input
                  id="settings-youtube"
                  value={settings.support_youtube || ""}
                  onChange={(e) => handleChange("support_youtube", e.target.value)}
                  placeholder="https://youtube.com/@miiam"
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600">info</span>
              <div>
                <p className="font-bold text-amber-800">How it works</p>
                <p className="text-sm text-amber-700 mt-1">
                  These values are stored in the database and used by the Customer App and Rider App support pages.
                  Changes here will reflect immediately in both apps.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "legal" && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-8 shadow-sm">
            <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm mb-6">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="settings-legal-email" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Support Email</label>
                <input
                  id="settings-legal-email"
                  type="email"
                  value={settings.support_email || ""}
                  onChange={(e) => handleChange("support_email", e.target.value)}
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-legal-phone" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Support Phone</label>
                <input
                  id="settings-legal-phone"
                  type="tel"
                  value={settings.support_phone || ""}
                  onChange={(e) => handleChange("support_phone", e.target.value)}
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-grievance-email" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Grievance Email</label>
                <input
                  id="settings-grievance-email"
                  type="email"
                  value={settings.grievance_email || ""}
                  onChange={(e) => handleChange("grievance_email", e.target.value)}
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-business-address" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Business Address</label>
                <input
                  id="settings-business-address"
                  type="text"
                  value={settings.business_address || ""}
                  onChange={(e) => handleChange("business_address", e.target.value)}
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-legal-city" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">City</label>
                <input
                  id="settings-legal-city"
                  type="text"
                  value={settings.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-legal-state" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">State</label>
                <input
                  id="settings-legal-state"
                  type="text"
                  value={settings.state || ""}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div>
                <label htmlFor="settings-legal-pincode" className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Pincode</label>
                <input
                  id="settings-legal-pincode"
                  type="text"
                  value={settings.pincode || ""}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  className="w-full p-4 border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-8 shadow-sm">
            <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm mb-6">Policy Pages</h3>
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-outline)]">
                Policy content is managed in the Terms of Service page. Updates to contacts above will reflect automatically on the site.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <a href="/terms" target="_blank" className="p-4 bg-[var(--color-surface-subtle)] rounded-xl text-center hover:bg-[var(--color-surface-container)]">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">description</span>
                  <p className="font-bold text-[var(--color-on-surface)] text-sm mt-2">Terms of Service</p>
                </a>
                <a href="/privacy" target="_blank" className="p-4 bg-[var(--color-surface-subtle)] rounded-xl text-center hover:bg-[var(--color-surface-container)]">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">privacy_tip</span>
                  <p className="font-bold text-[var(--color-on-surface)] text-sm mt-2">Privacy Policy</p>
                </a>
                <a href="/terms#refund" target="_blank" className="p-4 bg-[var(--color-surface-subtle)] rounded-xl text-center hover:bg-[var(--color-surface-container)]">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">attach_money</span>
                  <p className="font-bold text-[var(--color-on-surface)] text-sm mt-2">Refund Policy</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "system health" && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[var(--color-on-surface)] uppercase tracking-widest text-sm">System Health</h3>
              <button
                onClick={runHealthChecks}
                aria-label="Refresh health checks"
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold hover:opacity-90"
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {health.map((item) => (
                <div
                  key={item.label}
                  className={`p-5 rounded-2xl border transition-colors ${
                    item.status === "healthy"
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : item.status === "down"
                      ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                      : item.status === "slow"
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800"
                      : "bg-[var(--color-surface-subtle)] border-[var(--color-border-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        item.status === "healthy"
                          ? "bg-green-500"
                          : item.status === "down"
                          ? "bg-red-500"
                          : item.status === "slow"
                          ? "bg-amber-500"
                          : "bg-[var(--color-outline-variant)] animate-pulse"
                      }`}
                    />
                    <p className="font-black text-[var(--color-on-surface)] text-sm uppercase tracking-wider">{item.label}</p>
                  </div>
                  <p className="text-[var(--color-on-surface-variant)] text-xs font-medium ml-6">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="font-bold">Settings saved!</span>
          </div>
        )}
        <div />
        <button
          onClick={saveSettings}
          disabled={loading}
          className="px-8 py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
