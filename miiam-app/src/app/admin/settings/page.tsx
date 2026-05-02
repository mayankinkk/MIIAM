"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

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

      <div className="flex justify-end">
        <button className="px-8 py-4 bg-[#ba001c] text-white rounded-xl font-bold hover:opacity-90">
          Save Changes
        </button>
      </div>
    </div>
  );
}