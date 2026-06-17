"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useLanguageStore } from "@/lib/store/languageStore";
import { getTranslations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavLink {
  label: string;
  href: string;
}

interface LandingNavbarProps {
  variant?: "default" | "indigo";
  links?: NavLink[];
  showGetApp?: boolean;
  rightContent?: React.ReactNode;
}

export function LandingNavbar({
  variant = "default",
  links,
  showGetApp = true,
  rightContent,
}: LandingNavbarProps) {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setMounted(true);
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  const t = mounted ? getTranslations(language).landing : getTranslations("en").landing;

  const defaultLinks = [
    { label: t.navFood, href: "/app/food" },
    { label: t.navServices, href: "/services" },
    { label: t.navVendors, href: "/app/explore" },
    { label: t.navCareers, href: "/careers" },
    { label: t.navBusiness, href: "/about" },
  ];

  const navLinks = links || defaultLinks;
  const brandColor = variant === "indigo" ? "text-indigo-600" : "text-[var(--color-primary)]";
  const hoverColor = variant === "indigo" ? "hover:text-indigo-600" : "hover:text-[var(--color-primary)]";
  const afterBg = variant === "indigo" ? "after:bg-indigo-600" : "after:bg-[var(--color-primary)]";
  const linkColor = variant === "indigo" ? "text-indigo-600" : "text-[var(--color-primary)]";

  return (
    <nav className="fixed top-0 w-full z-50 bg-[var(--color-surface-container-lowest)]/80 backdrop-blur-2xl border-b border-[var(--color-border-subtle)]/80 transition-all duration-500">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <Link href="/" className={`text-3xl font-black ${brandColor} tracking-tighter select-none`}>
          MIIAM
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[var(--color-on-surface-variant)] font-semibold text-sm ${hoverColor} transition-colors duration-200 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 ${afterBg} after:transition-all after:duration-300 hover:after:w-full`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {mounted && <LanguageSwitcher />}
          {rightContent}
          {showGetApp && !rightContent && (
            mounted && user ? (
              <Link
                href="/app/profile"
                className="flex items-center gap-2.5 bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-container)] border border-[var(--color-border-subtle)] px-4 py-2 rounded-full transition-all duration-200 group"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-white flex items-center justify-center font-bold text-xs">
                  {user.email?.[0].toUpperCase()}
                </div>
                <span className={`text-sm font-semibold text-[var(--color-on-surface)] ${linkColor} hidden sm:block`}>
                  My Account
                </span>
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className={`${variant === "indigo" ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 hover:shadow-indigo-500/30" : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dim)] shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/30"} text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg active:scale-95 transition-all duration-200`}
              >
                {t.getApp}
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

export function LandingFooter() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = mounted ? getTranslations(language).landing : getTranslations("en").landing;

  return (
    <footer className="bg-[var(--color-inverse-surface)] w-full py-14 px-6 lg:px-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-10 max-w-7xl mx-auto">
        <div className="text-2xl font-black text-white tracking-tighter">MIIAM</div>
        <div className="flex flex-wrap gap-8 justify-center">
          <Link href="/terms" className="text-[var(--color-outline)] text-xs uppercase tracking-widest font-semibold hover:text-white transition-colors duration-200">
            Terms
          </Link>
          <Link href="/privacy" className="text-[var(--color-outline)] text-xs uppercase tracking-widest font-semibold hover:text-white transition-colors duration-200">
            Privacy
          </Link>
          <Link href="/refunds" className="text-[var(--color-outline)] text-xs uppercase tracking-widest font-semibold hover:text-white transition-colors duration-200">
            Refunds
          </Link>
          <Link href="/app/support" className="text-[var(--color-outline)] text-xs uppercase tracking-widest font-semibold hover:text-white transition-colors duration-200">
            Contact Us
          </Link>
        </div>
        <div className="text-[var(--color-on-surface-variant)] text-xs font-medium">
          {t.footerRights}
        </div>
      </div>
    </footer>
  );
}
