"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Settings {
  [key: string]: string | undefined;
  // General
  platform_name?: string;
  support_email?: string;
  support_phone?: string;
  platform_url?: string;
  maintenance_mode?: string;
  new_user_registration?: string;
  partner_onboarding?: string;
  // Delivery
  default_delivery_fee?: string;
  free_delivery_above?: string;
  max_delivery_radius?: string;
  max_order_value?: string;
  cancellation_grace_period?: string;
  auto_accept_orders?: string;
  // Payments
  platform_commission?: string;
  payment_gateway_fee?: string;
  payout_frequency?: string;
  min_payout_amount?: string;
  // Legal / Contact
  grievance_email?: string;
  business_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  // Legal content
  terms_content?: string;
  privacy_content?: string;
  refund_content?: string;
}

export default function SettingsPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    loadSettings();
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
        <h1 className="text-3xl font-black text-slate-800">Settings</h1>
        <p className="text-slate-400 text-sm">Platform configuration and preferences</p>
      </div>

      <div className="flex gap-4">
        {["general", "delivery", "payments", "notifications", "legal"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase ${
              activeTab === tab
                ? "bg-[#ba001c] text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Platform Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Platform Name</label>
                <input
                  type="text"
                  value={settings.platform_name || ""}
                  onChange={(e) => handleChange("platform_name", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Support Email</label>
                <input
                  type="email"
                  value={settings.support_email || ""}
                  onChange={(e) => handleChange("support_email", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Support Phone</label>
                <input
                  type="tel"
                  value={settings.support_phone || ""}
                  onChange={(e) => handleChange("support_phone", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Platform URL</label>
                <input
                  type="url"
                  value={settings.platform_url || ""}
                  onChange={(e) => handleChange("platform_url", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Business Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">Maintenance Mode</p>
                  <p className="text-xs text-slate-400">Disable platform for maintenance</p>
                </div>
                <button
                  onClick={() => toggleKey("maintenance_mode")}
                  className={`w-12 h-6 rounded-full relative transition-colors ${isOn("maintenance_mode") ? "bg-red-500" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isOn("maintenance_mode") ? "right-1" : "left-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">New User Registration</p>
                  <p className="text-xs text-slate-400">Allow new users to sign up</p>
                </div>
                <button
                  onClick={() => toggleKey("new_user_registration")}
                  className={`w-12 h-6 rounded-full relative transition-colors ${isOn("new_user_registration") ? "bg-green-500" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isOn("new_user_registration") ? "right-1" : "left-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">Partner Onboarding</p>
                  <p className="text-xs text-slate-400">Allow new vendors to apply</p>
                </div>
                <button
                  onClick={() => toggleKey("partner_onboarding")}
                  className={`w-12 h-6 rounded-full relative transition-colors ${isOn("partner_onboarding") ? "bg-green-500" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isOn("partner_onboarding") ? "right-1" : "left-1"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "delivery" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Delivery Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Default Delivery Fee (₹)</label>
              <input
                type="number"
                value={settings.default_delivery_fee || ""}
                onChange={(e) => handleChange("default_delivery_fee", e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Free Delivery Above (₹)</label>
              <input
                type="number"
                value={settings.free_delivery_above || ""}
                onChange={(e) => handleChange("free_delivery_above", e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Max Delivery Radius (km)</label>
              <input
                type="number"
                value={settings.max_delivery_radius || ""}
                onChange={(e) => handleChange("max_delivery_radius", e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Max Order Value (₹)</label>
              <input
                type="number"
                value={settings.max_order_value || ""}
                onChange={(e) => handleChange("max_order_value", e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cancellation Grace Period (seconds)</label>
              <input
                type="number"
                value={settings.cancellation_grace_period || ""}
                onChange={(e) => handleChange("cancellation_grace_period", e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Auto-Accept Orders</label>
              <select
                value={settings.auto_accept_orders || "true"}
                onChange={(e) => handleChange("auto_accept_orders", e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Payment Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Platform Commission (%)</label>
              <input
                type="number"
                value={settings.platform_commission || ""}
                onChange={(e) => handleChange("platform_commission", e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Payment Gateway Fee (%)</label>
              <input
                type="number"
                value={settings.payment_gateway_fee || ""}
                onChange={(e) => handleChange("payment_gateway_fee", e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Payout Frequency</label>
              <select
                value={settings.payout_frequency || "daily"}
                onChange={(e) => handleChange("payout_frequency", e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Min Payout Amount (₹)</label>
              <input
                type="number"
                value={settings.min_payout_amount || ""}
                onChange={(e) => handleChange("min_payout_amount", e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
              <div>
                <p className="font-bold text-slate-800">Order Updates</p>
                <p className="text-xs text-slate-400">Send push notifications for order status changes</p>
              </div>
              <button
                onClick={() => toggleKey("notif_order_updates")}
                className={`w-12 h-6 rounded-full relative transition-colors ${isOn("notif_order_updates") ? "bg-green-500" : "bg-slate-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isOn("notif_order_updates") ? "right-1" : "left-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
              <div>
                <p className="font-bold text-slate-800">Promotional Notifications</p>
                <p className="text-xs text-slate-400">Send offers and deals to users</p>
              </div>
              <button
                onClick={() => toggleKey("notif_promotions")}
                className={`w-12 h-6 rounded-full relative transition-colors ${isOn("notif_promotions") ? "bg-green-500" : "bg-slate-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isOn("notif_promotions") ? "right-1" : "left-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
              <div>
                <p className="font-bold text-slate-800">SMS Notifications</p>
                <p className="text-xs text-slate-400">Send SMS for critical updates</p>
              </div>
              <button
                onClick={() => toggleKey("notif_sms")}
                className={`w-12 h-6 rounded-full relative transition-colors ${isOn("notif_sms") ? "bg-green-500" : "bg-slate-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isOn("notif_sms") ? "right-1" : "left-1"}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "legal" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Support Email</label>
                <input
                  type="email"
                  value={settings.support_email || ""}
                  onChange={(e) => handleChange("support_email", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Support Phone</label>
                <input
                  type="tel"
                  value={settings.support_phone || ""}
                  onChange={(e) => handleChange("support_phone", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Grievance Email</label>
                <input
                  type="email"
                  value={settings.grievance_email || ""}
                  onChange={(e) => handleChange("grievance_email", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Business Address</label>
                <input
                  type="text"
                  value={settings.business_address || ""}
                  onChange={(e) => handleChange("business_address", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">City</label>
                <input
                  type="text"
                  value={settings.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">State</label>
                <input
                  type="text"
                  value={settings.state || ""}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Pincode</label>
                <input
                  type="text"
                  value={settings.pincode || ""}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Policy Pages</h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Policy content is managed in the Terms of Service page. Updates to contacts above will reflect automatically on the site.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <a href="/terms" target="_blank" className="p-4 bg-slate-50 rounded-xl text-center hover:bg-slate-100">
                  <span className="material-symbols-outlined text-[#ba001c]">description</span>
                  <p className="font-bold text-slate-700 text-sm mt-2">Terms of Service</p>
                </a>
                <a href="/privacy" target="_blank" className="p-4 bg-slate-50 rounded-xl text-center hover:bg-slate-100">
                  <span className="material-symbols-outlined text-[#ba001c]">privacy_tip</span>
                  <p className="font-bold text-slate-700 text-sm mt-2">Privacy Policy</p>
                </a>
                <a href="/terms#refund" target="_blank" className="p-4 bg-slate-50 rounded-xl text-center hover:bg-slate-100">
                  <span className="material-symbols-outlined text-[#ba001c]">attach_money</span>
                  <p className="font-bold text-slate-700 text-sm mt-2">Refund Policy</p>
                </a>
              </div>
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
          className="px-8 py-4 bg-[#ba001c] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
