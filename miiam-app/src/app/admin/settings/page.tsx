"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Settings {
  support_email?: string;
  support_phone?: string;
  grievance_email?: string;
  business_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  terms_content?: string;
  privacy_content?: string;
  refund_content?: string;
}

export default function SettingsPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    support_email: "support@miiam.in",
    support_phone: "+91 98765 43210",
    grievance_email: "grievance@miiam.in",
    business_address: "Guwahati, Assam",
    city: "Guwahati",
    state: "Assam",
    pincode: "781001",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const res = await fetch("/api/settings");
    const data = await res.json();
    if (data.settings) {
      setSettings((prev: any) => ({ ...prev, ...data.settings }));
    }
    setLoading(false);
  }

  async function saveSettings() {
    setLoading(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  }

  function handleChange(key: string, value: string) {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  }

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
                <input type="text" defaultValue="MIIAM" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Support Email</label>
                <input type="email" defaultValue="support@miiam.com" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Support Phone</label>
                <input type="tel" defaultValue="+91 1800 123 4567" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Platform URL</label>
                <input type="url" defaultValue="https://miiam.com" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
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
                <button className="w-12 h-6 bg-slate-200 rounded-full relative">
                  <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">New User Registration</p>
                  <p className="text-xs text-slate-400">Allow new users to sign up</p>
                </div>
                <button className="w-12 h-6 bg-green-500 rounded-full relative">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">Partner Onboarding</p>
                  <p className="text-xs text-slate-400">Allow new vendors to apply</p>
                </div>
                <button className="w-12 h-6 bg-green-500 rounded-full relative">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
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
              <input type="number" defaultValue="39" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Free Delivery Above (₹)</label>
              <input type="number" defaultValue="299" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Max Delivery Radius (km)</label>
              <input type="number" defaultValue="10" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Max Order Value (₹)</label>
              <input type="number" defaultValue="5000" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cancellation Grace Period (seconds)</label>
              <input type="number" defaultValue="60" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Auto-Accept Orders</label>
              <select className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none">
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
              <input type="number" defaultValue="15" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Payment Gateway Fee (%)</label>
              <input type="number" defaultValue="2" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Payout Frequency</label>
              <select className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Min Payout Amount (₹)</label>
              <input type="number" defaultValue="500" className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20" />
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