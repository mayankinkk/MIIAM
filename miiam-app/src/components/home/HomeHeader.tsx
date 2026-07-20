"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguageStore, type Language } from "@/lib/store/languageStore";

interface HomeHeaderProps {
  userName: string;
  greeting: string;
  timeIcon: string;
  location: string;
  unreadCount: number;
  onLocationClick: () => void;
  onNotificationsClick: () => void;
}

export default function HomeHeader({ userName, greeting, timeIcon, location, unreadCount, onLocationClick, onNotificationsClick }: HomeHeaderProps) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  return (
    <header className="bg-surface border-b border-outline-variant/10">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-black text-primary">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">{greeting} {timeIcon}</p>
              <h1 className="text-xl font-black text-on-surface capitalize leading-tight">{userName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const langs: Language[] = ["en", "hi", "as", "bn"];
                const idx = langs.indexOf(language);
                setLanguage(langs[(idx + 1) % langs.length]);
              }}
              className="h-8 px-2.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-bold border border-outline-variant/15 flex items-center gap-1 active:scale-95 transition-transform"
              aria-label="Toggle language"
            >
              <span className="material-symbols-outlined text-[14px]">translate</span>
              {language.toUpperCase()}
            </button>
            <button
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
              onClick={onNotificationsClick}
              className="relative w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center active:scale-95 transition-all border border-outline-variant/10"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant" aria-hidden="true" style={{ fontVariationSettings: unreadCount > 0 ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-surface flex items-center justify-center animate-bounce">
                  <span className="text-[9px] text-white font-black leading-none px-0.5">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Location Quick Switch */}
      <div className="px-5 pb-3">
        <button
          onClick={onLocationClick}
          className="flex items-center gap-3 bg-primary/5 hover:bg-primary/10 px-4 py-2.5 rounded-2xl w-full transition-colors border border-primary/10"
        >
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-lg">location_on</span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{t.home.deliveringTo}</p>
            <p className="font-bold text-on-surface text-sm truncate">{location}</p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-xl">unfold_more</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pb-4">
        <Link href="/app/search" className="flex items-center w-full bg-surface-container-high rounded-2xl px-4 py-3.5 hover:bg-surface-container-highest transition-all border border-outline-variant/10 active:scale-[0.99]">
          <span className="material-symbols-outlined text-primary text-xl">search</span>
          <span className="ml-3 text-on-surface-variant/70 text-sm flex-1">{t.home.searchPlaceholder}</span>
          <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">mic</span>
        </Link>
      </div>
    </header>
  );
}
