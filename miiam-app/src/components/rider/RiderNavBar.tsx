"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface RiderNavBarProps {
  active?: string;
}

export default function RiderNavBar({ active }: RiderNavBarProps) {
  const supabase = useMemo(() => createClient(), []);
  const [isOnline, setIsOnline] = useState(true);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string; email?: string } | null } }) => {
      if (!user) return;
      supabase.from("riders").select("id, is_online").eq("user_id", user.id).maybeSingle().then(({ data }: { data: { id: string; is_online: boolean | null } | null }) => {
        if (data) {
          setRiderId(data.id);
          setIsOnline(data.is_online ?? true);
        }
      });
    });
  }, []);

  const toggleOnline = async () => {
    if (!riderId || toggling) return;
    setToggling(true);
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await supabase.from("riders").update({ is_online: newStatus }).eq("id", riderId);
    setToggling(false);
  };

  const navItems = [
    { name: "Map", href: "/rider/dashboard", icon: "map" },
    { name: "Orders", href: "/rider/orders", icon: "list_alt" },
    { name: "Shifts", href: "/rider/shifts", icon: "schedule" },
    { name: "Wallet", href: "/rider/wallet", icon: "account_balance_wallet" },
    { name: "Account", href: "/rider/account", icon: "person" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-4 bg-[var(--color-surface-container-lowest)]/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[2rem]"
      style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <button
        onClick={toggleOnline}
        className="flex flex-col items-center p-2"
        aria-label={isOnline ? "Go Offline" : "Go Online"}
        aria-pressed={isOnline}
        title={isOnline ? "Go Offline" : "Go Online"}
      >
        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isOnline ? "bg-status-success border-status-success" : "bg-[var(--color-surface-container-high)] border-[var(--color-outline-variant)]"}`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-[var(--color-surface-container-lowest)]" : "bg-slate-400"}`} />
        </span>
        <span className={`text-[8px] font-bold mt-0.5 ${isOnline ? "text-status-success" : "text-[var(--color-outline-variant)]"}`}>
          {isOnline ? "ONLINE" : "OFF"}
        </span>
      </button>
      {navItems.map(item => (
        <Link
          key={item.name}
          href={item.href}
          aria-label={item.name}
          className={`flex flex-col items-center p-2 ${
            active === item.name.toLowerCase() ? "text-brand-secondary" : "text-[var(--color-on-surface-variant)]"
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
