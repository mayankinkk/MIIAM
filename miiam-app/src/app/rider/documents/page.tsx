"use client";

import Link from "next/link";

const documents = [
  { name: "Driving License", number: "DL-1234567890", expiry: "2027-05-15", status: "verified" },
  { name: "Vehicle Registration", number: "HR-01-AB-1234", expiry: "2026-12-31", status: "verified" },
  { name: "ID Proof (Aadhaar)", number: "XXXX-XXXX-1234", expiry: "", status: "verified" },
];

export default function RiderDocumentsPage() {
  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-[#0b50d5] text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex items-center gap-4">
          <Link href="/rider/account" className="text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Documents</h1>
        </div>
      </header>

      <main className="p-6 space-y-6 pb-32">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="font-bold text-[#4d212a] mb-4">My Documents</h2>
          <div className="space-y-4">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600">verified</span>
                  </div>
                  <div>
                    <p className="font-bold text-[#4d212a]">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.number}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full py-4 bg-[#0b50d5] text-white rounded-2xl font-bold flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">upload</span>
          Upload New Document
        </button>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600">info</span>
            <div>
              <p className="font-bold text-amber-800 text-sm">Document Verification</p>
              <p className="text-xs text-amber-600 mt-1">
                Your documents are verified. Please update before expiry to continue accepting orders.
              </p>
            </div>
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