"use client";

import { useState } from "react";
import Link from "next/link";

const referralStats = {
  totalReferrals: 12,
  successfulReferrals: 8,
  totalEarned: 4000,
  pendingBonus: 500,
};

const referralSteps = [
  { step: 1, title: "Share Link", description: "Send your unique referral link", icon: "share" },
  { step: 2, title: "Friend Signs Up", description: "Friend downloads app and registers", icon: "person_add" },
  { step: 3, title: "They Complete 10 Orders", description: "Your friend delivers 10 orders", icon: "inventory_2" },
  { step: 4, title: "You Earn ₹500", description: "Get ₹500 bonus instantly", icon: "payments" },
];

const referrals = [
  { name: "Rahul S.", phone: "98765*****0", joinedDate: "2024-02-10", orders: 15, status: "Completed", bonus: 500 },
  { name: "Ankit M.", phone: "91234*****5", joinedDate: "2024-02-15", orders: 8, status: "In Progress", bonus: 0 },
  { name: "Sneha P.", phone: "99887*****2", joinedDate: "2024-02-01", orders: 20, status: "Completed", bonus: 500 },
];

export default function RiderReferralPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = "MIIAM2024";
  const referralLink = "https://miiam.app/ref/rider123";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
        </div>
        <h1 className="text-2xl font-bold mt-4">🎁 Refer Friends</h1>
        <p className="text-sm opacity-80">Earn ₹500 for each referral</p>
      </header>

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
            <p className="text-xs text-slate-400">Total Earned</p>
            <p className="text-2xl font-black text-green-600">₹{referralStats.totalEarned}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
            <p className="text-xs text-slate-400">Pending Bonus</p>
            <p className="text-2xl font-black text-amber-600">₹{referralStats.pendingBonus}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
            <p className="text-xs text-slate-400">Successful</p>
            <p className="text-2xl font-black text-[#0b50d5]">{referralStats.successfulReferrals}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-lg text-center">
            <p className="text-xs text-slate-400">Total Referrals</p>
            <p className="text-2xl font-black text-purple-600">{referralStats.totalReferrals}</p>
          </div>
        </div>

        {/* Share Card */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-2xl text-white">
          <h3 className="font-bold text-xl mb-4">Share & Earn</h3>
          
          <div className="bg-white/20 p-4 rounded-xl mb-4">
            <p className="text-xs opacity-70 mb-1">Your Referral Code</p>
            <p className="text-2xl font-black tracking-wider">{referralCode}</p>
          </div>

          <div className="flex gap-2 mb-4">
            <button 
              onClick={copyToClipboard}
              className="flex-1 bg-white text-purple-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">{copied ? "check" : "content_copy"}</span>
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button className="flex-1 bg-white/20 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">share</span>
              Share
            </button>
          </div>

          <p className="text-xs text-center opacity-70">
            Your friend gets ₹200 off first order + you earn ₹500
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">How It Works</h3>
          <div className="space-y-4">
            {referralSteps.map((step) => (
              <div key={step.step} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600">{step.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Step {step.step}: {step.title}</p>
                  <p className="text-xs text-slate-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Referrals */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Your Referrals</h3>
          <div className="space-y-3">
            {referrals.map((ref, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600">person</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{ref.name}</p>
                    <p className="text-xs text-slate-400">{ref.phone} • {ref.joinedDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    ref.status === "Completed" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                  }`}>
                    {ref.status}
                  </span>
                  {ref.bonus > 0 && (
                    <p className="text-xs text-green-600 font-bold mt-1">+₹{ref.bonus}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share to Social */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">Share On</h3>
          <div className="flex justify-around">
            {[
              { name: "WhatsApp", icon: "💬", color: "bg-green-100" },
              { name: "Facebook", icon: "📘", color: "bg-blue-100" },
              { name: "Twitter", icon: "🐦", color: "bg-sky-100" },
              { name: "Instagram", icon: "📸", color: "bg-pink-100" },
            ].map((social, i) => (
              <button key={i} className={`flex flex-col items-center gap-1 p-3 rounded-xl ${social.color}`}>
                <span className="text-2xl">{social.icon}</span>
                <span className="text-[10px] font-bold">{social.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="bg-slate-50 p-4 rounded-xl">
          <h4 className="font-bold text-sm mb-2">Terms & Conditions</h4>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• Referral bonus credited after friend completes 10 orders</li>
            <li>• Minimum 10 deliveries required within 30 days</li>
            <li>• Both new and existing users can refer</li>
            <li>• Maximum 50 referrals per month</li>
          </ul>
        </div>
      </main>

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