"use client";

import Link from "next/link";

interface RiderNavBarProps {
  active?: string;
}

export default function RiderNavBar({ active }: RiderNavBarProps) {
  const navItems = [
    { name: "Map", href: "/rider/dashboard", icon: "map" },
    { name: "Orders", href: "/rider/orders", icon: "list_alt" },
    { name: "Wallet", href: "/rider/wallet", icon: "account_balance_wallet" },
    { name: "Account", href: "/rider/account", icon: "person" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-4 bg-white/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[2rem]"
      style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
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
