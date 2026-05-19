"use client";

import Link from "next/link";

const legalLinks = [
  { icon: "description", title: "Terms of Service", sub: "Rules and conditions of use", href: "/terms" },
  { icon: "privacy_tip", title: "Privacy Policy", sub: "How we handle your data", href: "/privacy" },
  { icon: "assignment_return", title: "Refund Policy", sub: "Returns & cancellations", href: "/terms#refund" },
  { icon: "gavel", title: "Cookie Policy", sub: "How we use cookies", href: "/terms#cookies" },
  { icon: "contact_support", title: "Grievance Officer", sub: "Raise a formal complaint", href: "/app/support" },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#fff4f4] dark:bg-slate-950 pb-24">
      <header className="bg-white dark:bg-slate-900 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/app/settings" className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a] dark:text-white">Legal</h1>
        </div>
      </header>

      <main className="p-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
          {legalLinks.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${i !== legalLinks.length - 1 ? "border-b border-slate-100 dark:border-slate-700" : ""}`}
            >
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-white">{item.title}</p>
                <p className="text-xs text-slate-500">{item.sub}</p>
              </div>
              <span className="material-symbols-outlined text-slate-400">open_in_new</span>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          MIIAM v1.0 · © 2025 MIIAM Technologies Pvt. Ltd.
          <br />Registered in India · CIN: U74999XX2025PTC000001
        </p>
      </main>
    </div>
  );
}
