"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface HomeHeaderProps {
  userName: string;
  greeting: string;
  timeIcon: string;
  location: string;
  unreadCount: number;
  etaMinutes?: number;
  onLocationClick: () => void;
  onNotificationsClick: () => void;
}

export default function HomeHeader({ userName, greeting, timeIcon, location, unreadCount, etaMinutes, onLocationClick, onNotificationsClick }: HomeHeaderProps) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 bg-surface transition-all duration-200 ${scrolled ? "shadow-[0_2px_12px_rgba(0,0,0,0.08)]" : "border-b border-border-subtle"}`}>
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] leading-snug font-extrabold text-on-surface truncate capitalize">
              {greeting}, {userName} {timeIcon}
            </h1>
          </div>
          <button
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            onClick={onNotificationsClick}
            className="relative w-9 h-9 rounded-full bg-surface-container flex items-center justify-center shrink-0 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant" aria-hidden="true" style={{ fontVariationSettings: unreadCount > 0 ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-status-error rounded-full border-2 border-surface flex items-center justify-center animate-bounce">
                <span className="text-[9px] text-white font-black leading-none px-0.5">{unreadCount > 9 ? "9+" : unreadCount}</span>
              </span>
            )}
          </button>
          <Link
            href="/app/profile"
            aria-label="Profile"
            className="w-9 h-9 rounded-full bg-surface-container border border-border-subtle flex items-center justify-center shrink-0 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person</span>
          </Link>
        </div>

        {etaMinutes != null && etaMinutes > 0 && (
          <p className="text-[13px] font-bold text-on-surface mt-1 leading-snug">
            Delivery in ~{etaMinutes} min
          </p>
        )}

        {/* Address row */}
        <button
          onClick={onLocationClick}
          className="group flex items-center w-full mt-0.5 text-left"
          aria-label="Change delivery location"
        >
          <span className="text-[13px] text-on-surface-variant truncate group-hover:text-on-surface transition-colors">{location}</span>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">arrow_drop_down</span>
        </button>

        {/* Search */}
        <Link href="/app/search" className="mt-2.5 flex items-center w-full h-11 bg-surface-container-high rounded-[10px] px-3.5 gap-3 hover:bg-surface-container-highest transition-all active:scale-[0.99]">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">search</span>
          <span className="text-on-surface-variant/80 text-sm flex-1 truncate">{t.home.searchPlaceholder}</span>
          <span className="material-symbols-outlined text-on-surface-variant/60 text-lg">mic</span>
        </Link>
      </div>
    </header>
  );
}
