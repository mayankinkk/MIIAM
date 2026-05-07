"use client";

import { useState } from "react";
import Link from "next/link";

export default function RiderSettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [language, setLanguage] = useState("English");
  const [autoAccept, setAutoAccept] = useState(false);
  const [onlyHighEarnings, setOnlyHighEarnings] = useState(false);
  const [preferredOrderTypes, setPreferredOrderTypes] = useState<string[]>(["food", "grocery"]);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const orderTypes = [
    { id: "food", label: "Food Delivery", icon: "🍔" },
    { id: "grocery", label: "Grocery", icon: "🛒" },
    { id: "pharmacy", label: "Pharmacy", icon: "💊" },
    { id: "parcel", label: "Parcels", icon: "📦" },
  ];

  const toggleOrderType = (typeId: string) => {
    if (preferredOrderTypes.includes(typeId)) {
      if (preferredOrderTypes.length > 1) {
        setPreferredOrderTypes(preferredOrderTypes.filter(t => t !== typeId));
      }
    } else {
      setPreferredOrderTypes([...preferredOrderTypes, typeId]);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-[#0b50d5] text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
        </div>
        <h1 className="text-2xl font-bold mt-4">⚙️ Settings</h1>
        <p className="text-sm opacity-80">Customize your experience</p>
      </header>

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* Account Section */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Account</h3>
          <div className="space-y-3">
            <Link href="/rider/account" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">person</span>
                <span className="font-bold">Profile</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
            <Link href="/rider/documents" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">badge</span>
                <span className="font-bold">Documents</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
            <Link href="/rider/vehicle" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">two_wheeler</span>
                <span className="font-bold">My Vehicle</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* Order Preferences */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Order Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">autorenew</span>
                <span className="font-bold">Auto-Accept Orders</span>
              </div>
              <button 
                onClick={() => setAutoAccept(!autoAccept)}
                className={`w-12 h-6 rounded-full transition-colors ${autoAccept ? "bg-green-500" : "bg-slate-200"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${autoAccept ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">trending_up</span>
                <span className="font-bold">Only High Earnings</span>
              </div>
              <button 
                onClick={() => setOnlyHighEarnings(!onlyHighEarnings)}
                className={`w-12 h-6 rounded-full transition-colors ${onlyHighEarnings ? "bg-green-500" : "bg-slate-200"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${onlyHighEarnings ? "translate-x-6" : "translate-x-0.5"}`} />
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
                        ? "bg-[#0b50d5] text-white"
                        : "bg-slate-50 text-slate-600"
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
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">volume_up</span>
                <span className="font-bold">Sound</span>
              </div>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${soundEnabled ? "bg-green-500" : "bg-slate-200"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${soundEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">vibration</span>
                <span className="font-bold">Vibration</span>
              </div>
              <button 
                onClick={() => setVibrationEnabled(!vibrationEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${vibrationEnabled ? "bg-green-500" : "bg-slate-200"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${vibrationEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>

            <Link href="/rider/notifications" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">notifications</span>
                <span className="font-bold">Notification History</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Appearance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">dark_mode</span>
                <span className="font-bold">Dark Mode</span>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full transition-colors ${darkMode ? "bg-green-500" : "bg-slate-200"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
            
            <button 
              onClick={() => setShowLanguageModal(true)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">language</span>
                <span className="font-bold">Language</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{language}</span>
                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
              </div>
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Support</h3>
          <div className="space-y-3">
            <Link href="/rider/support" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">help</span>
                <span className="font-bold">Help Center</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
            <Link href="/rider/incident" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">emergency</span>
                <span className="font-bold text-red-600">Report Incident</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
            <Link href="/rider/training" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-600">school</span>
                <span className="font-bold">Training</span>
              </div>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* Privacy & Legal */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Privacy & Legal</h3>
          <div className="space-y-3">
            <button className="flex items-center justify-between p-3 bg-slate-50 rounded-xl w-full">
              <span className="font-bold">Privacy Policy</span>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
            <button className="flex items-center justify-between p-3 bg-slate-50 rounded-xl w-full">
              <span className="font-bold">Terms of Service</span>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
            <button className="flex items-center justify-between p-3 bg-slate-50 rounded-xl w-full">
              <span className="font-bold">Data & Privacy</span>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-slate-400">MIIAM Rider v1.0.0 • Made with ❤️</p>
      </main>

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl mb-4">Select Language</h3>
            <div className="space-y-2">
              {["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLanguageModal(false); }}
                  className={`w-full p-4 rounded-xl font-bold text-left transition-all ${
                    language === lang 
                      ? "bg-[#0b50d5] text-white" 
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <button onClick={() => setShowLanguageModal(false)} className="w-full py-3 text-slate-500 font-bold mt-4">
              Cancel
            </button>
          </div>
        </div>
      )}

      <RiderNavBar active="account" />
    </div>
  );
}

function RiderNavBar({ active }: { active: string }) {
  const navItems = [
    { name: "Map", href: "/rider/dashboard", icon: "map" },
    { name: "Orders", href: "/rider/orders", icon: "list_alt" },
    { name: "Wallet", href: "/rider/wallet", icon: "account_balance_wallet" },
    { name: "Account", href: "/rider/account", icon: "person" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-white/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[3rem]">
      {navItems.map(item => (
        <Link
          key={item.name}
          href={item.href}
          className={`flex flex-col items-center p-2 ${
            active === item.name.toLowerCase() ? "text-[#0b50d5]" : "text-[#814c55]"
          }`}
        >
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: active === item.name.toLowerCase() ? "'FILL' 1" : "'FILL' 0" }}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}