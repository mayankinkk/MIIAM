"use client";

import Link from "next/link";

const notifications = [
  { id: 1, title: "New Order Available", message: "Order #1234 from Burger Prime - ₹120 earnings", time: "2 mins ago", read: false },
  { id: 2, title: "Order Completed", message: "Order #1230 delivered successfully!", time: "15 mins ago", read: true },
  { id: 3, title: "Payout Processed", message: "₹1,500 transferred to your bank account", time: "1 hour ago", read: true },
  { id: 4, title: "Rating Received", message: "You received a 5-star rating from customer", time: "2 hours ago", read: true },
  { id: 5, title: "Weekly Goal Achieved", message: "Congratulations! You completed 12 deliveries this week", time: "Yesterday", read: true },
];

export default function RiderNotificationsPage() {
  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-[#0b50d5] text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex items-center gap-4">
          <Link href="/rider/account" className="text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Notifications</h1>
        </div>
      </header>

      <main className="p-6 space-y-4 pb-32">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`bg-white p-4 rounded-2xl shadow-lg ${notif.read ? "opacity-75" : ""}`}
          >
            <div className="flex items-start gap-3">
              {!notif.read && (
                <span className="w-3 h-3 bg-[#0b50d5] rounded-full mt-2"></span>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-[#4d212a]">{notif.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{notif.message}</p>
                <p className="text-xs text-slate-400 mt-2">{notif.time}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </div>
          </div>
        ))}
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