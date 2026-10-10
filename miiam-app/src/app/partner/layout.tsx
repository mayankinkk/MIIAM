"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getVendorForUser } from "@/lib/vendor";
import InstallPrompt from "@/components/InstallPrompt";

const navLinks = [
  { href: "/partner/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/partner/pos", label: "Live POS", icon: "point_of_sale" },
  { href: "/partner/kot", label: "KOT", icon: "receipt" },
  { href: "/partner/orders", label: "Orders", icon: "receipt_long" },
  { href: "/partner/menu", label: "Menu & Inventory", icon: "restaurant_menu" },
  { href: "/partner/analytics", label: "Analytics", icon: "analytics" },
  { href: "/partner/reviews", label: "Reviews", icon: "reviews" },
  { href: "/partner/chat", label: "Chat Support", icon: "chat" },
  { href: "/partner/wallet", label: "Wallet & Payouts", icon: "account_balance_wallet" },
  { href: "/partner/promotions", label: "Promotions", icon: "local_offer" },
  { href: "/partner/profile", label: "Store Settings", icon: "store" },
];

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vendor, setVendor] = useState<{
    shop_name: string;
    status: string;
    owner_name: string;
    type?: string;
    id?: string;
  } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    getVendorForUser().then(setVendor);
  }, []);

  useEffect(() => {
    if (pathname === "/partner" || pathname === "/partner/register") return;

    supabase.auth
      .getUser()
      .then(
        ({
          data: { user },
          error,
        }: {
          data: { user: { id: string; email?: string } | null };
          error: unknown;
        }) => {
          if (error || !user) router.push("/auth/login?redirect=" + pathname);
        }
      );
  }, [router, supabase, pathname, vendor]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const initials = vendor?.shop_name
    ? vendor.shop_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "VD";

  const isPublicPage = pathname === "/partner" || pathname === "/partner/register";

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-subtle)]">
      <head>
        <link rel="manifest" href="/partner-manifest.json" />
        <meta name="theme-color" content="#ba001c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MIIAM Partner" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      {/* Sidebar */}
      <aside className="fixed z-20 hidden h-full w-64 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] md:flex">
        <div className="flex items-center justify-center border-b border-[var(--color-border-subtle)] p-6">
          <Link
            href="/partner/dashboard"
            className="text-2xl font-extrabold tracking-tighter text-[var(--color-primary)]"
          >
            MIIAM{" "}
            <span className="ml-1 text-sm tracking-normal text-[var(--color-on-surface)]">
              Partner
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/partner" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--color-surface-container)] font-bold text-[var(--color-primary)]"
                    : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-subtle)]"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--color-border-subtle)] p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
            <div className="text-on-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold">
              {initials}
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-sm font-bold text-[var(--color-on-surface)]">
                {vendor?.shop_name || "Your Store"}
              </p>
              <p className="flex items-center gap-1 text-xs font-bold">
                <span
                  className={`h-2 w-2 animate-pulse rounded-full ${vendor?.status === "active" ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"}`}
                ></span>
                <span
                  className={
                    vendor?.status === "active"
                      ? "text-green-600 dark:text-green-400"
                      : "text-[var(--color-outline-variant)]"
                  }
                >
                  {vendor?.status === "active" ? "Online" : vendor?.status || "Loading..."}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-[var(--color-outline)] transition-colors hover:text-[var(--color-on-surface)]"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative flex-1 md:ml-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-4 py-3 md:hidden">
          <Link
            href="/partner/dashboard"
            className="text-xl font-extrabold tracking-tighter text-[var(--color-primary)]"
          >
            MIIAM{" "}
            <span className="ml-1 text-xs tracking-normal text-[var(--color-on-surface)]">
              Partner
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-[var(--color-on-surface)]"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="relative z-20 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-4 py-2 md:hidden">
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-[var(--color-surface-subtle)] px-4 py-3">
              <div className="text-on-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold">
                {initials}
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="truncate text-sm font-bold text-[var(--color-on-surface)]">
                  {vendor?.shop_name || "Your Store"}
                </p>
                <p className="text-xs font-bold text-green-600 dark:text-green-400">
                  {vendor?.status === "active" ? "Online" : "Loading..."}
                </p>
              </div>
            </div>
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/partner" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--color-surface-container)] font-bold text-[var(--color-primary)]"
                      : "text-[var(--color-on-surface-variant)]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="mt-2 flex w-full items-center gap-3 border-t border-[var(--color-border-subtle)] px-4 py-3 pt-4 text-sm font-medium text-[var(--color-outline)] transition-colors hover:text-[var(--color-on-surface)]"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out
            </button>
          </div>
        )}

        {children}
      </main>
      <InstallPrompt />
    </div>
  );
}
