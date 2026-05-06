"use client";

import Link from "next/link";
import { useState } from "react";

const faqs = [
  { q: "How do I accept an order?", a: "Go to the Orders tab and tap 'Start Shopping' on any available order." },
  { q: "When do I get paid?", a: "Payouts are processed daily. You can request instant payouts anytime." },
  { q: "How does advance work?", a: "For grocery orders, you receive advance money to pay the vendor. Collect payment from customer if required." },
  { q: "What if an item is unavailable?", a: "Mark it as 'Not Available' in the order details. The customer will be notified." },
];

export default function RiderSupportPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-[#0b50d5] text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex items-center gap-4">
          <Link href="/rider/account" className="text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Help & Support</h1>
        </div>
      </header>

      <main className="p-6 space-y-6 pb-32">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="font-bold text-[#4d212a] mb-4">Contact Us</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <span className="material-symbols-outlined text-[#0b50d5]">call</span>
              <span className="flex-1 text-left font-bold">Call Support</span>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
            <button className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <span className="material-symbols-outlined text-[#0b50d5]">chat</span>
              <span className="flex-1 text-left font-bold">Chat with Us</span>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
            <button className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <span className="material-symbols-outlined text-[#0b50d5]">email</span>
              <span className="flex-1 text-left font-bold">Email Support</span>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="font-bold text-[#4d212a] mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-slate-100 pb-3">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="font-bold text-[#4d212a]">{faq.q}</span>
                  <span className="material-symbols-outlined text-slate-400">
                    {expanded === i ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {expanded === i && (
                  <p className="text-sm text-slate-500 mt-2">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
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