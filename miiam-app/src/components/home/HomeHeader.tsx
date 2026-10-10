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

export default function HomeHeader({
  userName,
  greeting,
  timeIcon,
  location,
  unreadCount,
  etaMinutes,
  onLocationClick,
  onNotificationsClick,
}: HomeHeaderProps) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`bg-surface sticky top-0 z-50 transition-all duration-200 ${scrolled ? "shadow-[0_2px_12px_rgba(0,0,0,0.08)]" : "border-border-subtle border-b"}`}
    >
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-on-surface truncate text-[17px] leading-snug font-extrabold capitalize">
              {greeting}, {userName} {timeIcon}
            </h1>
          </div>
          <button
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            onClick={onNotificationsClick}
            className="bg-surface-container relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-95"
          >
            <span
              className="material-symbols-outlined text-on-surface-variant text-[20px]"
              aria-hidden="true"
              style={{ fontVariationSettings: unreadCount > 0 ? "'FILL' 1" : "'FILL' 0" }}
            >
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="bg-status-error border-surface absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] animate-bounce items-center justify-center rounded-full border-2">
                <span className="px-0.5 text-[9px] leading-none font-black text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </span>
            )}
          </button>
          <Link
            href="/app/profile"
            aria-label="Profile"
            className="bg-surface-container border-border-subtle flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              person
            </span>
          </Link>
        </div>

        {etaMinutes != null && etaMinutes > 0 && (
          <p className="text-on-surface mt-1 text-[13px] leading-snug font-bold">
            Delivery in ~{etaMinutes} min
          </p>
        )}

        {/* Address row */}
        <button
          onClick={onLocationClick}
          className="group mt-0.5 flex w-full items-center text-left"
          aria-label="Change delivery location"
        >
          <span className="text-on-surface-variant group-hover:text-on-surface truncate text-[13px] transition-colors">
            {location}
          </span>
          <span className="material-symbols-outlined text-on-surface-variant shrink-0 text-[18px]">
            arrow_drop_down
          </span>
        </button>

        {/* Search */}
        <Link
          href="/app/search"
          className="bg-surface-container-high hover:bg-surface-container-highest mt-2.5 flex h-11 w-full items-center gap-3 rounded-[10px] px-3.5 transition-all active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl">search</span>
          <span className="text-on-surface-variant/80 flex-1 truncate text-sm">
            {t.home.searchPlaceholder}
          </span>
          <span className="material-symbols-outlined text-on-surface-variant/60 text-lg">mic</span>
        </Link>
      </div>
    </header>
  );
}
